import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import type { Order } from '../contracts/checkout'
import { priceInEth, priceInWei } from '../contracts/eth'

export function ConfirmedReceipt({ receipt }: { receipt: NonNullable<Order['receipt']> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const [copyStatus, setCopyStatus] = useState('')
  const { quote, transactionId, confirmedAt, wallet } = receipt

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog ref={dialog} aria-labelledby="receipt-title"
      onClose={() => void navigate({ to: '/cart' })}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[680px] overflow-y-auto overscroll-contain border-0 border-b-[6px] border-primary bg-card p-0 text-foreground backdrop:bg-black/75">
      <div className="relative space-y-2 px-8 pt-6 pb-5 text-center">
        <button type="button" aria-label="Fechar pedido" onClick={() => dialog.current?.close()}
          className="absolute top-1 right-1 grid size-11 place-items-center text-xl text-accent">×</button>
        <span aria-hidden="true" className="block text-5xl leading-none text-accent">✉</span>
        <h1 id="receipt-title" className="text-lg font-bold text-accent">Compra confirmada</h1>
        <p className="text-sm text-secondary">Seus NFTs agora estão na sua carteira simulada.</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-y border-primary/60 px-4 py-4 text-xs text-secondary sm:grid-cols-4 sm:divide-x sm:divide-primary/60 sm:px-6">
        <div className="min-w-0">
          <dt className="font-bold">ID da transação</dt>
          <dd className="break-all">Transação simulada: {transactionId}</dd>
        </div>
        <div className="sm:pl-3">
          <dt>Data</dt>
          <dd><time dateTime={confirmedAt}>{new Date(confirmedAt).toLocaleDateString('pt-BR')}</time></dd>
        </div>
        <div className="sm:pl-3">
          <dt>Total</dt>
          <dd>{quote.totalEth} ETH</dd>
        </div>
        <div className="sm:pl-3">
          <dt>Carteira</dt>
          <dd className="break-words">{wallet.provider}</dd>
        </div>
      </dl>
      <div className="space-y-4 p-4 sm:px-8 sm:py-6">
        <h2 className="text-sm font-bold">Detalhes da transação</h2>
        <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-edge pb-2 text-xs font-bold">
          <span>NFTs</span><span>Edições</span><span>Subtotal</span>
        </div>
        <ul className="space-y-3" aria-label="NFTs comprados">
          {quote.lines.map((line) => (
            <li key={line.lineId} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-xs sm:gap-4 sm:text-sm">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                {line.image && <img src={line.image.src} alt="" width="52" height="52" className="size-10 shrink-0 rounded-lg object-cover sm:size-[52px]" />}
                <div className="min-w-0">
                  <p className="font-bold">{line.name}</p>
                  <p className="text-xs text-secondary">Edição {line.editionLabel}</p>
                </div>
              </div>
              <span aria-label={`${line.quantity} unidades`} className="text-secondary">×{line.quantity}</span>
              <span className="text-right font-bold text-accent">{priceInEth(priceInWei(line.priceEth) * BigInt(line.quantity))} ETH</span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b border-edge pb-3 text-sm">
          {quote.discountEth !== '0' && <><dt>Desconto</dt><dd>{quote.discountEth} ETH</dd></>}
          <dt>Taxa de rede</dt><dd className="text-right">{quote.networkFeeEth} ETH</dd>
          <dt className="font-bold">Total</dt><dd className="text-right font-bold text-accent">{quote.totalEth} ETH</dd>
        </dl>
        <p className="text-center text-xs leading-relaxed text-secondary">Pagamento confirmado na simulação. Rede selecionada: {quote.networkId === 'polygon' ? 'Polygon' : 'Ethereum'}.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={async () => {
            try {
              await navigator.clipboard.writeText(transactionId)
              setCopyStatus('ID copiado.')
            } catch {
              setCopyStatus('Não foi possível copiar o ID.')
            }
          }}>Copiar ID</Button>
          <Link to="/cart" className="text-sm text-primary underline">Voltar ao carrinho</Link>
        </div>
        {copyStatus && <p role="status" className="text-center text-xs">{copyStatus}</p>}
      </div>
    </dialog>
  )
}
