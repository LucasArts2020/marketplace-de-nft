import { Link } from '@tanstack/react-router'
import { errorMessage } from '../api/http'
import { Button } from '../components/ui/button'
import { useCart } from './use-cart'
import { useRealtime } from '../socket/realtime-context'
import { priceInEth, priceInWei } from '../contracts/eth'

export function CartPage() {
  const { cart, quote, mutation, enabled } = useCart(true)
  const lines = cart.isError ? undefined : cart.data?.lines
  const { market } = useRealtime()
  const changed = lines?.some((line) => market[line.nftId]?.payload.editions?.some((edition) => edition.editionId === line.editionId))

  return (
    <section className="space-y-5" aria-labelledby="cart-title">
      <p className="hidden text-sm text-secondary md:block">Início / Mercado / Carrinho</p>
      <div className="mobile-flow-heading">
        <Link to="/" hash="catalog-title" className="mobile-back md:hidden" aria-label="Voltar ao mercado">‹</Link>
        <h1 id="cart-title" className="text-lg font-bold md:text-3xl">Carrinho de NFTs</h1>
      </div>
      {changed && <p role="status">O mercado atualizou o preço ou o estoque de um item.</p>}
      {cart.isPending && enabled && <p role="status">Carregando carrinho…</p>}
      {cart.isError && (
        <div className="space-y-2">
          <p role="alert">{errorMessage(cart.error, 'Não foi possível carregar o carrinho.')}</p>
          <Button onClick={() => void cart.refetch()}>Tentar novamente</Button>
        </div>
      )}
      {lines?.length === 0 && <p>Seu carrinho está vazio.</p>}
      {lines && lines.length > 0 && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] lg:gap-9">
          <ul className="min-w-0 space-y-3" aria-label="Itens do carrinho">
            {lines.map((line) => (
              <li key={line.lineId} className="mobile-cart-line rounded-xl border border-edge bg-card p-2 md:space-y-3 md:p-4">
                <div className="flex min-w-0 items-center gap-2 md:gap-3">
                  {line.image && <img src={line.image.src} alt="" width="72" height="72" className="size-16 shrink-0 rounded-lg object-cover sm:size-[72px]" />}
                  <div className="min-w-0">
                    <Link to="/nfts/$id" params={{ id: line.nftId }} className="text-xs font-semibold underline md:text-base">{line.name}</Link>
                    <p className="text-xs text-secondary md:text-sm">Edição {line.editionLabel}<span className="hidden md:inline"> · {line.priceEth} ETH por unidade</span></p>
                    <p className="mt-1 text-xs font-bold text-accent md:hidden">{priceInEth(priceInWei(line.priceEth) * BigInt(line.quantity))} ETH</p>
                  </div>
                </div>
                {line.quantity > line.available && <p role="alert">Estoque disponível: {line.available}. Revise este item.</p>}
                <div className="mobile-cart-controls flex flex-wrap items-center gap-2">
                  <Button variant="outline" aria-label={`Diminuir quantidade de ${line.name}`}
                    disabled={mutation.isPending || line.quantity <= Math.max(1, line.reservedQuantity) || line.available === 0}
                    onClick={() => mutation.mutate({ kind: 'quantity', lineId: line.lineId, quantity: Math.min(line.quantity - 1, line.available) })}>−</Button>
                  <output aria-label={`Quantidade de ${line.name}`}>{line.quantity}</output>
                  <Button variant="outline" aria-label={`Aumentar quantidade de ${line.name}`}
                    disabled={mutation.isPending || line.quantity >= line.available}
                    onClick={() => mutation.mutate({ kind: 'quantity', lineId: line.lineId, quantity: line.quantity + 1 })}>+</Button>
                  <Button variant="outline" aria-label={`Remover ${line.name}`} disabled={mutation.isPending || line.reservedQuantity > 0}
                    onClick={() => mutation.mutate({ kind: 'remove', lineId: line.lineId })}>Remover</Button>
                </div>
              </li>
            ))}
          </ul>
          <aside aria-label="Resumo da carteira" className="space-y-4 rounded-2xl border border-edge bg-surface p-4 sm:p-6">
            <h2 className="sr-only text-xl font-semibold md:not-sr-only">Resumo da carteira</h2>
            <form className="mobile-coupon-form md:space-y-2" onSubmit={(event) => {
              event.preventDefault()
              const code = new FormData(event.currentTarget).get('coupon')
              if (typeof code === 'string' && code.trim()) mutation.mutate({ kind: 'coupon', code })
            }}>
              <label className="grid gap-1">
                <span className="sr-only md:not-sr-only">Código promocional</span>
                <input name="coupon" placeholder="Digite o código promocional..." className="min-h-11 w-full rounded-md border border-secondary px-3 text-xs md:text-base" required />
              </label>
              <Button disabled={mutation.isPending}>Aplicar</Button>
            </form>
            {cart.data?.couponCode && (
              <div className="flex flex-wrap items-center gap-2">
                <span>Cupom: {cart.data.couponCode}</span>
                <Button variant="outline" disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ kind: 'clear-coupon' })}>Remover cupom</Button>
              </div>
            )}
            {quote.isPending && <div role="status" className="space-y-2">
              <span className="sr-only">Calculando cotação…</span>
              <div aria-hidden="true" className="skeleton h-24 rounded-md" />
            </div>}
            {quote.isError && (
              <>
                <p role="alert">{errorMessage(quote.error, 'Não foi possível calcular a cotação.')}</p>
                <Button variant="outline" onClick={() => void quote.refetch()}>Recalcular</Button>
              </>
            )}
            {quote.data && !quote.isError && (
              <dl className="grid grid-cols-[1fr_auto] gap-2 break-words text-sm">
                <dt>Subtotal</dt><dd>{quote.data.subtotalEth} ETH</dd>
                <dt>Desconto</dt><dd>{quote.data.discountEth} ETH</dd>
                <dt>Taxa de rede</dt><dd>{quote.data.networkFeeEth} ETH</dd>
                <dt className="border-t border-edge pt-3 font-bold">Total</dt><dd data-testid="cart-total" className="border-t border-edge pt-3 font-bold text-accent">{quote.data.totalEth} ETH</dd>
              </dl>
            )}
            {quote.data && !quote.isError && <Button asChild className="mobile-flow-cta w-full"><Link to="/checkout">
              <span className="md:hidden">Conectar e finalizar</span><span className="hidden md:inline">Finalizar compra</span>
            </Link></Button>}
            {cart.data?.pendingOrderId && (
              <Link to="/orders/$id" params={{ id: cart.data.pendingOrderId }} className="text-primary underline">Acompanhar pedido</Link>
            )}
          </aside>
        </div>
      )}
      {mutation.isError && <p role="alert">{errorMessage(mutation.error, 'Não foi possível atualizar o carrinho.')}</p>}
      <Link to="/" className="inline-block text-primary underline">Continuar explorando</Link>
    </section>
  )
}
