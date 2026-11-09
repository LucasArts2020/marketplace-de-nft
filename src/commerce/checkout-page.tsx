import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import { useEffect, useId, useRef, useState } from 'react'
import { connectWallet, createOrder, disconnectWallet, getAttempt, getOrder, getWallets } from '../api/checkout'
import { getProfile } from '../api/account'
import { quoteCart } from '../api/commerce'
import { errorMessage } from '../api/http'
import { Button } from '../components/ui/button'
import type { Quote } from '../contracts/cart'
import { collectorFields, parseCollector, type Collector, type OrderRequest, type WalletConnection } from '../contracts/checkout'
import { useSession } from './session'
import { useCart } from './use-cart'
import { useAccountData } from './account-data'
import { useRealtime } from '../socket/realtime-context'
import { ConfirmedReceipt } from './confirmed-receipt'
import { accountInput } from './account-layout'
import { priceInEth, priceInWei } from '../contracts/eth'

interface Attempt {
  key: string
  body: OrderRequest
  orderId?: string
}

const checkoutFields = [
  'displayName', 'username', 'network', 'profileName', 'address', 'alternateWalletReference',
  'provider', 'referralCode', 'email', 'ensName', 'note',
] as const

function attemptKey(userId: string) {
  return 'kurio.order-attempt.' + userId
}

function readAttempt(userId: string): Attempt | null {
  try {
    return JSON.parse(sessionStorage.getItem(attemptKey(userId)) ?? 'null') as Attempt | null
  } catch {
    return null
  }
}

function QuoteSummary({ quote }: { quote: Quote }) {
  return (
    <div className="min-w-0 space-y-3 text-sm">
      <div aria-hidden="true" className="flex justify-between border-b border-edge pb-2 text-xs"><span>NFTs</span><span>Subtotal</span></div>
      <ul className="space-y-2">
        {quote.lines.map((line) => (
          <li key={line.lineId} className="flex items-center gap-2 bg-card p-1.5 text-sm">
            {line.image && <img src={line.image.src} alt="" width="48" height="48" className="size-12 shrink-0 rounded-md object-cover" />}
            <span className="min-w-0 grow"><strong>{line.name}</strong><br /><span className="text-xs text-secondary">Edição {line.editionLabel} · ×{line.quantity}</span></span>
            <span className="shrink-0 text-xs font-bold text-accent">{priceInEth(priceInWei(line.priceEth) * BigInt(line.quantity))} ETH</span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[1fr_auto] gap-2">
        <dt>Subtotal</dt><dd>{quote.subtotalEth} ETH</dd>
        <dt>Desconto</dt><dd>{quote.discountEth} ETH</dd>
        <dt>Taxa de rede</dt><dd>{quote.networkFeeEth} ETH</dd>
        <dt className="border-t border-edge pt-3 font-bold">Total</dt><dd className="border-t border-edge pt-3 font-bold text-accent">{quote.totalEth} ETH</dd>
      </dl>
    </div>
  )
}

export function CheckoutPage() {
  const { identity, session, expire, active } = useSession()
  const { cart, quote: cartQuote } = useCart(true)
  const cache = useQueryClient()
  const navigate = useNavigate()
  const userId = session!.user.id
  const token = identity.token!
  const [attempt, setAttempt] = useState(() => readAttempt(userId))
  const [walletId, setWalletId] = useState('')
  const [network, setNetwork] = useState('')
  const [connection, setConnection] = useState<WalletConnection>()
  const [review, setReview] = useState<{ quote: Quote; body: OrderRequest }>()
  const draftKey = 'kurio.checkout-draft.' + userId
  const [draft, setDraft] = useState<Partial<Collector>>(() => {
    try { return JSON.parse(sessionStorage.getItem(draftKey) ?? '{}') ?? {} } catch { return {} }
  })
  const [message, setMessage] = useState('')
  const messageId = useId()
  const submitting = useRef(false)
  const { request } = useAccountData()
  const profile = useQuery({
    queryKey: ['private', identity.generation, 'profile'],
    queryFn: ({ signal }) => request((credential) => getProfile(credential, signal)),
    retry: false,
  })
  const wallets = useQuery({
    queryKey: ['private', identity.generation, 'wallets'],
    queryFn: ({ signal }) => request((credential) => getWallets(credential, signal)),
    retry: false,
  })
  const wallet = wallets.data?.find((entry) => entry.id === walletId) ?? wallets.data?.[0]
  const networkId = wallet?.networks.includes(network) ? network : wallet?.networks[0]
  const { market } = useRealtime()
  const staleReview = review && (
    cart.data?.version !== review.quote.cartVersion ||
    review.quote.lines.some((line) => {
      const current = cart.data?.lines.find((entry) => entry.lineId === line.lineId)
      const event = market[line.nftId]
      return !current || current.editionVersion !== line.editionVersion || current.available !== line.available ||
        (event && event.version > review.quote.catalogVersion &&
          event.payload.editions?.some((edition) => edition.editionId === line.editionId))
    })
  )
  const defaults: Partial<Collector> = {
    username: session?.user.username,
    displayName: profile.data?.displayName,
    email: profile.data?.email,
    ensName: profile.data?.ensName,
  }

  function showError(error: unknown, fallback: string) {
    if (axios.isAxiosError(error) && error.response?.status === 401) expire(identity.generation)
    setMessage(errorMessage(error, fallback))
  }

  const walletAction = useMutation({
    mutationFn: async () => {
      if (connection) {
        await disconnectWallet(token, connection.id)
        return undefined
      }
      if (!wallet || !networkId) throw new Error('Selecione uma carteira.')
      return connectWallet(token, wallet.id, networkId)
    },
    onSuccess: setConnection,
    onError: (error) => showError(error, 'Não foi possível conectar a carteira.'),
  })
  const networkPicker = wallet && (
    <label className="grid gap-1">Rede
      <select className={accountInput} value={networkId} disabled={Boolean(connection) || walletAction.isPending}
        onChange={(event) => setNetwork(event.target.value)}>
        {wallet.networks.map((id) => <option key={id} value={id}>{id === 'polygon' ? 'Polygon' : 'Ethereum'}</option>)}
      </select>
    </label>
  )
  const reviewAction = useMutation({
    mutationFn: async (data: unknown) => {
      const collector = parseCollector(data)
      if (!collector || !connection || !cart.data?.lines.length) throw new Error('Revise os campos obrigatórios.')
      setDraft(collector)
      const quote = await quoteCart(token, cart.data.version, undefined, connection.networkId)
      return { quote, body: { quoteId: quote.id, connectionId: connection.id, collector } }
    },
    onSuccess: setReview,
    onError: (error) => showError(error, error.message),
  })
  const send = useMutation({
    gcTime: 0,
    mutationFn: async ({ value, recover }: { value: Attempt; recover: boolean }) => {
      if (recover) {
        try { return await getAttempt(token, value.key) } catch (error) {
          if (!axios.isAxiosError(error) || error.response?.status !== 404) throw error
        }
      }
      return createOrder(token, value.key, value.body)
    },
  })

  async function submit(value: Attempt, recover: boolean) {
    if (submitting.current) return
    submitting.current = true
    setMessage('')
    try {
      sessionStorage.setItem(attemptKey(userId), JSON.stringify(value))
      setAttempt(value)
      const order = await send.mutateAsync({ value, recover })
      if (!active(identity.generation)) return
      sessionStorage.removeItem(draftKey)
      sessionStorage.setItem(attemptKey(userId), JSON.stringify({ ...value, orderId: order.id }))
      void cache.invalidateQueries({ queryKey: ['private', identity.generation, 'cart'] })
      await navigate({ to: '/orders/$id', params: { id: order.id } })
    } catch (error) {
      if (!active(identity.generation)) return
      if (axios.isAxiosError(error) && [409, 422].includes(error.response?.status ?? 0)) {
        sessionStorage.removeItem(attemptKey(userId))
        setAttempt(null)
        setReview(undefined)
        if (error.response?.status === 422) setConnection(undefined)
        void cache.invalidateQueries({ queryKey: ['private', identity.generation, 'cart'] })
      }
      showError(error, 'Não recebemos a resposta. Recupere a tentativa antes de enviar novamente.')
    } finally {
      send.reset()
      submitting.current = false
    }
  }

  return (
    <section className="space-y-5">
      <p className="hidden text-sm text-secondary md:block">Início / Mercado / Pagamento</p>
      <div className="mobile-flow-heading md:contents">
        <Link to="/cart" className="mobile-back md:hidden" aria-label="Voltar ao carrinho">‹</Link>
        <h1 className="text-base font-bold md:sr-only">Pagamento com carteira</h1>
      </div>
      {message && <p id={messageId} role="alert">{message}</p>}
      {attempt ? (
        <Button disabled={send.isPending} onClick={() => void submit(attempt, true)}>
          {send.isPending ? 'Consultando pedido…' : 'Recuperar tentativa'}
        </Button>
      ) : (
        <>
          {(wallets.isPending || cart.isPending || profile.isPending) && <p role="status">Carregando pagamento…</p>}
          {(wallets.isError || cart.isError) && <p role="alert">Não foi possível carregar os dados do pagamento.</p>}
          {cart.data?.lines.length === 0 && <p>Seu carrinho está vazio.</p>}
          {wallets.data?.length === 0 && <Link to="/wallets" className="text-primary underline">Cadastrar carteira</Link>}
          {Boolean(cart.data?.lines.length) && wallet && !profile.isPending && (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)] lg:gap-8">
              <aside className="mobile-checkout-aside min-w-0 space-y-4 lg:col-start-2 lg:row-start-1" aria-label="Carteira e pedido">
              {!review && cartQuote.data && !cartQuote.isError && (
                <section className="space-y-2" aria-label="Seus NFTs">
                  <h2 className="font-bold">Seus NFTs</h2>
                  <QuoteSummary quote={cartQuote.data} />
                  <Link to="/cart" className="block text-center text-xs text-secondary underline">Aplicar cupom no carrinho</Link>
                </section>
              )}
              <div className="space-y-3 text-sm md:border-t md:border-edge md:pt-4">
                <h2 className="font-bold md:text-center">Carteira e rede</h2>
                <label className="hidden gap-1 md:grid">Carteira
                  <select className="min-h-11 rounded-md border border-edge bg-card px-2" value={wallet.id} disabled={Boolean(connection) || walletAction.isPending}
                    onChange={(event) => setWalletId(event.target.value)}>
                    {wallets.data?.map((entry) => <option key={entry.id} value={entry.id}>
                      {entry.provider} · {entry.id === 'primary' ? 'Principal' : 'Secundária'}
                    </option>)}
                  </select>
                </label>
                <fieldset className="space-y-2 md:hidden" disabled={Boolean(connection) || walletAction.isPending}>
                  <legend className="mb-2 text-xs text-secondary">Carteiras cadastradas</legend>
                  {wallets.data?.map((entry) => (
                    <label key={entry.id} className="mobile-wallet-card">
                      <input type="radio" name="checkout-wallet" checked={entry.id === wallet.id} onChange={() => setWalletId(entry.id)} />
                      <span className="min-w-0">
                        <strong>{entry.id === 'primary' ? 'Principal' : 'Secundária'}</strong>
                        <span className="block break-all text-xs text-secondary">{entry.provider} · {entry.address.slice(0, 6)}…{entry.address.slice(-4)}</span>
                        <span className="block text-xs text-secondary">{entry.networks.map((id) => id === 'polygon' ? 'Polygon' : 'Ethereum').join(' · ')}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="md:hidden">{networkPicker}</div>
                {connection && <p role="status" className="break-all">Carteira conectada · {connection.wallet.address}</p>}
                <Button variant={connection ? 'outline' : 'default'} className="w-full" disabled={walletAction.isPending || reviewAction.isPending} onClick={() => {
                  setMessage('')
                  setReview(undefined)
                  walletAction.mutate()
                }}>{connection ? 'Desconectar carteira' : 'Conectar carteira'}</Button>
              </div>
              </aside>
              <form className="min-w-0 space-y-5 text-sm lg:col-start-1 lg:row-start-1"
                aria-describedby={reviewAction.isError && message ? messageId : undefined}
                hidden={Boolean(review)} onChange={(event) => {
                const values = Object.fromEntries(new FormData(event.currentTarget)) as Partial<Collector>
                setDraft(values)
                sessionStorage.setItem(draftKey, JSON.stringify(values))
              }} onSubmit={(event) => {
                event.preventDefault()
                setMessage('')
                reviewAction.mutate(Object.fromEntries(new FormData(event.currentTarget)))
              }}>
                <fieldset className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <legend className="mb-4 text-base font-bold">Perfil do colecionador</legend>
                  {checkoutFields.map((name) => {
                    if (name === 'network') return <div className="hidden md:block" key={name}>{networkPicker}</div>
                    if (name === 'address' || name === 'provider') return (
                      <div className="grid min-w-0 gap-1" key={name}>{name === 'address' ? 'Endereço da carteira' : 'Tipo de carteira'}
                        <p className={accountInput + ' flex items-center break-all py-1 text-secondary'}>{wallet[name]}</p>
                      </div>
                    )
                    const label = collectorFields.find(([key]) => key === name)?.[1]
                    return (
                      <label className="grid min-w-0 gap-1" key={name}>{label}
                        {name === 'note' ? <textarea name={name} rows={4} maxLength={250}
                          defaultValue={draft[name]} className={accountInput + ' py-2'} /> :
                        <input name={name} type={name === 'email' ? 'email' : 'text'} maxLength={250}
                          required={name !== 'alternateWalletReference'}
                          defaultValue={draft[name] ?? defaults[name]}
                          className={accountInput} />}
                      </label>
                    )
                  })}
                </fieldset>
                <Button disabled={!connection || reviewAction.isPending || walletAction.isPending}>Revisar pedido</Button>
              </form>
              {review && (
                <section className="min-w-0 space-y-3 rounded-xl border border-edge bg-surface p-4 lg:col-start-1 lg:row-start-1" aria-label="Revisão do pedido">
                  <h3 className="text-xl font-semibold">Revisão do pedido</h3>
                  <p>{review.body.collector.displayName} · {review.body.collector.email} · {connection?.wallet.provider}</p>
                  <QuoteSummary quote={review.quote} />
                  {staleReview && <p role="status">A cotação mudou. Revise os valores antes de confirmar.</p>}
                  <div className="flex flex-wrap gap-3">
                    <Button className="mobile-flow-cta w-full md:w-auto" disabled={send.isPending || Boolean(staleReview)} onClick={() => void submit({ key: crypto.randomUUID(), body: review.body }, false)}>
                      Confirmar compra
                    </Button>
                    <Button variant="outline" onClick={() => setReview(undefined)}>Editar dados</Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
      <Link to="/cart" className="hidden text-primary underline md:inline-block">Voltar ao carrinho</Link>
    </section>
  )
}

export function OrderPage({ id }: { id: string }) {
  const { identity, session, expire } = useSession()
  const cache = useQueryClient()
  const { connected } = useRealtime()
  const query = useQuery({
    queryKey: ['private', identity.generation, 'order', id],
    queryFn: ({ signal }) => getOrder(identity.token!, id, signal),
    retry: false,
    refetchInterval: (query) => query.state.data?.status === 'pending' ? (connected ? 5000 : 500) : false,
  })
  const order = query.data
  const userId = session!.user.id
  useEffect(() => {
    if (axios.isAxiosError(query.error) && query.error.response?.status === 401) expire(identity.generation)
    if (!order || order.status === 'pending') return
    // Preserve a different in-flight attempt if an older receipt is opened.
    const attempt = readAttempt(userId)
    if (attempt?.orderId === id) sessionStorage.removeItem(attemptKey(userId))
    void cache.invalidateQueries({ queryKey: ['private', identity.generation, 'cart'] })
    void cache.invalidateQueries({ queryKey: ['nft'] })
  }, [cache, expire, id, identity.generation, identity.token, order, query.error, userId])

  if (order?.status === 'confirmed' && order.receipt && !query.isError) {
    return <ConfirmedReceipt key={order.id} receipt={order.receipt} />
  }

  return (
    <section className="mx-auto max-w-xl space-y-5 rounded-2xl border border-edge bg-surface p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-edge pb-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-secondary">KURIO · MERCADO</p>
          <h1 className="mt-2 text-2xl font-bold">Pedido</h1>
        </div>
        <Link to="/cart" aria-label="Fechar pedido" className="grid size-11 shrink-0 place-items-center rounded-md border border-edge text-xl">×</Link>
      </div>
      {query.isPending && <p role="status">Consultando pedido…</p>}
      {query.isError && (
        <div className="space-y-2">
          <p role="alert">{errorMessage(query.error, 'Não foi possível consultar o pedido.')}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>Consultar novamente</Button>
        </div>
      )}
      {order?.status === 'pending' && <p role="status">Pagamento pendente.</p>}
      {order?.status === 'pending' && <p>{connected ? 'Atualizações em tempo real conectadas.' : 'Reconectando. Consultando o pedido pela API.'}</p>}
      {order?.status === 'rejected' && <p role="alert">{order.reason}</p>}
      <Link to="/cart" className="inline-block text-primary underline">Voltar ao carrinho</Link>
    </section>
  )
}
