import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import axios from 'axios'
import { useRef, useState } from 'react'
import { getNft, listCatalog } from '../api/catalog'
import { errorMessage } from '../api/http'
import { useCart } from '../commerce/use-cart'
import { FavoriteButton } from '../commerce/favorites'
import { Button } from '../components/ui/button'
import { parseCatalogSearch, type NftDetail } from '../contracts/catalog'
import { priceInEth, priceInWei } from '../contracts/eth'
import { NftCardView } from './catalog-page'
import { Loading } from './loading'

function Gallery({ nft }: { nft: NftDetail }) {
  const [index, setIndex] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const image = nft.gallery[index] ?? nft.image

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row-reverse lg:gap-6">
      <div className="relative min-w-0 flex-1 rounded-lg bg-card md:p-3 lg:p-5">
        <img className="aspect-[6/5] w-full rounded-2xl object-cover object-top md:aspect-square md:object-center" width={480} height={480} src={image.src} alt={image.alt} fetchPriority="high" />
        <button type="button" aria-label="Ampliar imagem" className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-ink/85"
          onClick={() => dialog.current?.showModal()}><img src="/art/search.svg" alt="" /></button>
      </div>
      <div aria-label="Galeria" role="group" className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:gap-3">
        {nft.gallery.map((entry, position) => (
          <button key={position} type="button" aria-label={`Imagem ${position + 1}`}
            className="size-11 overflow-hidden rounded-lg border border-transparent aria-pressed:border-primary md:size-14 lg:size-[clamp(64px,7vw,100px)]"
            aria-pressed={position === index} onClick={() => setIndex(position)}>
            <img src={entry.src === nft.gallery[0]?.src ? nft.image.src : entry.src} alt="" width="100" height="100" className="size-full object-cover" />
          </button>
        ))}
      </div>
      <dialog ref={dialog} aria-label="Arte ampliada" className="fixed inset-0 m-auto max-h-[90dvh] max-w-[90vw] overflow-auto rounded-xl bg-card p-4 text-foreground backdrop:bg-black/80">
        <div className="mb-2 flex justify-end">
          <Button variant="outline" onClick={() => dialog.current?.close()}>Fechar imagem</Button>
        </div>
        <img src={image.src} alt={image.alt} width="680" height="680" loading="lazy" className="max-h-[72dvh] w-auto rounded-lg object-contain" />
      </dialog>
    </div>
  )
}

function NftInformation({ nft }: { nft: NftDetail }) {
  const [reviews, setReviews] = useState(false)
  return (
    <section aria-label="Informações do NFT" className="space-y-4">
      <div role="group" aria-label="Seções de informação" className="flex flex-wrap gap-x-5 border-b border-edge">
        <button type="button" aria-pressed={!reviews} onClick={() => setReviews(false)}
          className="min-h-11 border-b-2 border-transparent text-sm aria-pressed:border-accent aria-pressed:text-accent">Detalhes do NFT</button>
        <button type="button" aria-pressed={reviews} onClick={() => setReviews(true)}
          className="min-h-11 border-b-2 border-transparent text-sm aria-pressed:border-accent aria-pressed:text-accent">
          Avaliações de colecionadores{nft.rating ? ` (${nft.rating.count})` : ''}
        </button>
      </div>
      {reviews ? (
        <p className="text-sm text-secondary">{nft.rating
          ? `Nota média de ${nft.rating.score.toLocaleString('pt-BR')} de 5 em ${nft.rating.count} avaliações simuladas.`
          : 'Este NFT ainda não tem avaliações.'}</p>
      ) : (
        <div className="space-y-4 text-sm leading-relaxed text-secondary">
          {(nft.details ?? [nft.description]).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <dl className="space-y-3">
            <div><dt className="font-bold text-foreground">Rede</dt><dd>{nft.network}</dd></div>
            <div><dt className="font-bold text-foreground">Coleção</dt><dd>{nft.collection}</dd></div>
            <div><dt className="font-bold text-foreground">ID do token</dt><dd>#{nft.tokenId}</dd></div>
          </dl>
        </div>
      )}
    </section>
  )
}

function RelatedNfts({ nft }: { nft: NftDetail }) {
  const [page, setPage] = useState(0)
  const search = parseCatalogSearch({ collection: [nft.collection] })
  const query = useQuery({
    queryKey: ['catalog', search],
    queryFn: ({ signal }) => listCatalog(search, signal),
    staleTime: 30_000,
    retry: false,
  })
  const items = query.data?.items.filter((item) => item.id !== nft.id) ?? []
  const pages = Math.ceil(items.length / 5)
  const current = Math.min(page, Math.max(0, pages - 1))

  if (!items.length) return null
  return (
    <section aria-labelledby="related-title" className="space-y-6">
      <h2 id="related-title" className="border-b border-edge pb-3 text-sm font-bold text-accent">Mais desta coleção</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
        {items.slice(current * 5, current * 5 + 5).map((item) => <NftCardView item={item} key={item.id} />)}
      </ul>
      {pages > 1 && (
        <nav aria-label="Mais desta coleção" className="flex justify-center gap-1">
          {Array.from({ length: pages }, (_, index) => (
            <button key={index} type="button" className="grid size-9 place-items-center rounded-full"
              aria-label={`Grupo ${index + 1} da coleção`} aria-current={index === current ? 'page' : undefined}
              onClick={() => setPage(index)}>
              <span aria-hidden="true" className={`size-3 rounded-full border border-primary ${index === current ? 'bg-primary' : ''}`} />
            </button>
          ))}
        </nav>
      )}
    </section>
  )
}

function NftContent({ nft }: { nft: NftDetail }) {
  const { cart, mutation } = useCart()
  const [editionId, setEditionId] = useState(nft.editions[0]?.id)
  const [requestedQuantity, setQuantity] = useState(1)
  const [share, setShare] = useState('')
  const edition = nft.editions.find((entry) => entry.id === editionId)
  const available = edition?.available ?? 0
  const quantity = Math.min(requestedQuantity, available)

  return (
    <article className="mobile-nft space-y-12 lg:space-y-22">
      <div className="grid items-start gap-3 md:grid-cols-2 md:gap-5 lg:gap-8">
        <Gallery nft={nft} />
        <div className="mobile-nft-info min-w-0 space-y-3 rounded-2xl border border-edge bg-card p-4 md:border-0 md:bg-transparent md:p-0">
          <h1 className="text-lg font-bold md:text-3xl">{nft.name}</h1>
          <div className="mobile-nft-rating flex flex-wrap items-center justify-between gap-2 md:border-b md:border-edge md:pb-2">
            {edition && <p className="hidden text-xl font-bold text-accent md:block">{edition.priceEth} ETH</p>}
            {nft.rating && <p className="text-xs">
              <span className="rounded-full border border-primary px-2 py-1 text-accent md:hidden">★ {nft.rating.score} ({nft.rating.count})</span>
              <span className="hidden md:inline"><span aria-hidden="true" className="mr-2 text-accent">★★★★★</span>{nft.rating.count} avaliações de colecionadores</span>
            </p>}
          </div>
          <div className="space-y-1 text-sm">
            <h2 className="font-bold">Sobre este NFT</h2>
            <p className="leading-relaxed text-secondary">{nft.description}</p>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-bold">Edição</legend>
            <div className="flex flex-wrap gap-2">
              {[...nft.editions].sort((left, right) => {
                const order = ['single', 'ten', 'limited', 'open']
                return order.indexOf(left.id) - order.indexOf(right.id)
              }).map((entry) => (
                <button key={entry.id} type="button" aria-pressed={entry.id === editionId}
                  className="min-h-9 rounded-full border border-edge px-3 text-xs text-secondary aria-pressed:border-primary aria-pressed:text-accent"
                  onClick={() => { setEditionId(entry.id); setQuantity(1) }}>{entry.label}</button>
              ))}
            </div>
          </fieldset>
          <p role="status" className="text-xs text-secondary">{available ? `${available} disponíveis` : 'Edição indisponível.'}</p>
          <div className="mobile-nft-purchase flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2" role="group" aria-label="Quantidade">
              <Button className="size-11 rounded-full p-0" aria-label="Diminuir quantidade" disabled={quantity <= 1}
                onClick={() => setQuantity(quantity - 1)}>−</Button>
              <output className="min-w-4 text-center" aria-label="Quantidade selecionada">{quantity}</output>
              <Button className="size-11 rounded-full p-0" aria-label="Aumentar quantidade" disabled={quantity >= available}
                onClick={() => setQuantity(quantity + 1)}>+</Button>
            </div>
            {edition && <p className="self-center font-bold text-accent md:hidden">{priceInEth(priceInWei(edition.priceEth) * BigInt(quantity))} ETH</p>}
            <div className="mobile-nft-actions flex flex-wrap items-start gap-2">
              <Button aria-label="Comprar NFT, adicionar ao carrinho" className="px-5 uppercase" disabled={!edition || quantity < 1 || !cart.data || cart.isError || mutation.isPending}
                onClick={() => {
                  if (edition) mutation.mutate({ kind: 'add', nftId: nft.id, editionId: edition.id, quantity })
                }}><span className="md:hidden">Comprar NFT</span><span className="hidden md:inline">Comprar</span></Button>
              <div className="mobile-nft-favorite"><FavoriteButton id={nft.id} /></div>
              <Button asChild variant="outline" className="rounded-full md:hidden"><Link to="/cart" aria-label="Carrinho"><img src="/art/cart.svg" alt="" width="24" height="24" /></Link></Button>
            </div>
          </div>
          {mutation.isSuccess && <p role="status">NFT adicionado ao carrinho.</p>}
          {mutation.isError && <p role="alert">{errorMessage(mutation.error, 'Não foi possível adicionar o NFT.')}</p>}
          {cart.isError && <p role="alert">Não foi possível carregar o carrinho.</p>}
          <dl className="space-y-2 border-t border-edge pt-3 text-xs text-secondary">
            <div className="flex gap-2"><dt>ID do token:</dt><dd>#{nft.tokenId}</dd></div>
            <div className="flex gap-2"><dt>Coleção:</dt><dd>{nft.collection}</dd></div>
            {nft.attributes?.length ? <div className="flex gap-2"><dt>Atributos:</dt><dd>{nft.attributes.join(', ')}</dd></div> : null}
          </dl>
          <button type="button" className="min-h-9 text-sm font-bold text-accent underline" onClick={async () => {
            try {
              await navigator.clipboard.writeText(location.href)
              setShare('Link copiado.')
            } catch {
              setShare('Não foi possível copiar o link.')
            }
          }}>Compartilhar este NFT</button>
          {share && <p role="status" className="text-xs">{share}</p>}
        </div>
      </div>
      <NftInformation nft={nft} />
      <RelatedNfts nft={nft} />
    </article>
  )
}

export function NftPage({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ['nft', id],
    queryFn: ({ signal }) => getNft(id, signal),
    staleTime: 30_000,
    retry: false,
  })
  const missing = axios.isAxiosError(query.error) && query.error.response?.status === 404
  return (
    <section className="space-y-4">
      <Link to="/" hash="catalog-title" aria-label="Voltar ao mercado" className="mobile-back md:hidden">‹</Link>
      <nav aria-label="Localização" className="hidden gap-2 text-sm font-bold md:flex">
        <Link to="/">Início</Link><span aria-hidden="true">/</span><Link to="/" hash="catalog-title">Mercado</Link>
      </nav>
      {query.isPending && <Loading label="Carregando NFT" count={1} />}
      {query.isError && (
        <>
          <p role="alert">{missing ? 'NFT não encontrado.' : 'Não foi possível carregar o NFT.'}</p>
          {!missing && <Button onClick={() => void query.refetch()}>Tentar novamente</Button>}
        </>
      )}
      {query.data && <NftContent key={id} nft={query.data} />}
    </section>
  )
}
