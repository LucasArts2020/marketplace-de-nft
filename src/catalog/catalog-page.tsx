import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { listCatalog } from '../api/catalog'
import { Button } from '../components/ui/button'
import { parseCatalogSearch, type CatalogSearch, type NftCard } from '../contracts/catalog'
import { Loading } from './loading'
import { PriceRange } from './price-range'
import { HomeEditorial } from './home-editorial'
import { HeaderSearch } from './header-search'

export function NftCardView({ item }: { item: NftCard }) {
  return (
    <li className="min-w-0">
      <Link to="/nfts/$id" params={{ id: item.id }} className="block rounded-md focus-visible:outline-2">
        <div className="mobile-art-frame bg-card p-1 md:pt-7 md:pb-2">
          <img className="aspect-square w-full rounded-xl object-cover" src={item.image.src} alt={item.image.alt}
            width={480} height={480} loading="lazy" />
        </div>
        <h3 className="mt-2 text-xs sm:text-sm">{item.name}</h3>
        <p className="mt-1 text-sm font-semibold text-accent">{item.priceEth} ETH</p>
      </Link>
    </li>
  )
}

function Facet({ label, values, counts, selected, onChange }: {
  label: string
  values: string[]
  counts?: Record<string, number>
  selected: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="px-3">
      {values.map((value) => (
        <button key={value} type="button" aria-pressed={selected.includes(value)}
          className="flex min-h-9 w-full items-center justify-between gap-3 text-left text-xs text-secondary hover:text-foreground aria-pressed:font-bold aria-pressed:text-accent"
          onClick={() => onChange(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value])}>
          <span>{value}</span>
          {counts?.[value] !== undefined && <span aria-hidden="true">({counts[value]})</span>}
        </button>
      ))}
      </div>
    </fieldset>
  )
}

export function CatalogPage({ search, onNavigate }: {
  search: CatalogSearch
  onNavigate: (search: CatalogSearch) => void
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = useQuery({
    queryKey: ['catalog', search],
    queryFn: ({ signal }) => listCatalog(search, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  })
  const update = (patch: Partial<CatalogSearch>) => onNavigate(parseCatalogSearch({ ...search, page: 1, ...patch }))
  const data = query.data
  const loading = query.isPending
  const maxPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  const featured = data?.highlights[1] ?? data?.highlights[0]

  return (
    <section className="space-y-6" aria-labelledby="catalog-title">
      <div className="mobile-catalog-tools md:hidden">
        <HeaderSearch inline className="mobile-catalog-search" />
        <Button type="button" aria-label="Filtros do catálogo" aria-expanded={filtersOpen}
          aria-controls="catalog-filters" onClick={() => setFiltersOpen(!filtersOpen)}>
          <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7h5m4 0h9M3 17h10m4 0h4" /><circle cx="10" cy="7" r="2" /><circle cx="15" cy="17" r="2" />
          </svg>
        </Button>
      </div>
      <section className="market-hero grid min-h-48 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-xl p-4 md:min-h-[360px] md:gap-8 md:rounded-none md:py-0 md:pr-0 md:pl-10 xl:min-h-[450px] xl:grid-cols-[minmax(0,1fr)_450px]" aria-label="Bem-vindo à Kurio">
        <div className="space-y-2 md:space-y-4">
          <p className="text-xs tracking-widest sm:text-sm">Bem-vindo à Kurio</p>
          <h1 className="text-lg leading-tight font-bold md:text-3xl xl:text-[43px]">
            <span className="md:hidden">SEJA DONO DA CULTURA DIGITAL</span>
            <span className="hidden md:block">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</span>
          </h1>
          <p className="hidden max-w-[550px] text-sm leading-relaxed text-secondary sm:block">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</p>
          <p className="text-xs text-secondary sm:hidden">Descubra NFTs selecionados de criadores do mundo todo.</p>
          <Button asChild className="text-xs uppercase md:text-sm"><a href="#catalog-title">Explorar</a></Button>
        </div>
        <img src="/art/8f387-480.webp" srcSet="/art/8f387-480.webp 480w, /art/8f387-960.webp 960w" sizes="(min-width: 768px) 450px, 36vw" alt="Arte digital de Emerald Ape #042" width="480" height="480"
          fetchPriority="high" className="aspect-square w-full max-w-[450px] justify-self-end rounded-xl object-cover md:rounded-3xl" />
      </section>
      <div className="grid gap-5 lg:grid-cols-[minmax(220px,310px)_minmax(0,1fr)] lg:gap-12 lg:pt-12">
      <aside id="catalog-filters" aria-label="Filtros do catálogo" className="mobile-catalog-filters min-w-0 space-y-5" data-open={filtersOpen}>
      <div className="space-y-9 bg-card p-4 lg:p-5">
        {data && (
          <Facet label="Coleções" values={data.facets.category} counts={data.facetCounts.category} selected={search.category}
            onChange={(category) => update({ category })} />
        )}
        <PriceRange key={search.minPrice + ':' + search.maxPrice} minPrice={search.minPrice} maxPrice={search.maxPrice} onApply={update} />
        {data && <Facet label="Rede" values={data.facets.network} counts={data.facetCounts.network} selected={search.network}
          onChange={(network) => update({ network })} />}
        {data && <div className="md:hidden"><Facet label="Filtrar séries" values={data.facets.collection}
          selected={search.collection} onChange={(collection) => update({ collection })} /></div>}
      </div>
      {!loading && featured && !search.q && (
        <section aria-label="NFT em destaque" className="hidden bg-card lg:block">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-bold text-accent">NFT EM DESTAQUE</h2>
            <p className="mt-2 text-center font-bold">OFERTA LIMITADA</p>
          </div>
          <Link to="/nfts/$id" params={{ id: featured.id }} aria-label={featured.name} className="block">
            <img src={featured.image.src} alt={featured.image.alt} width="480" height="480" loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
          </Link>
        </section>
      )}
      </aside>
      <div className="min-w-0 space-y-5">
      <h2 id="catalog-title" tabIndex={-1} className="sr-only focus:not-sr-only">Catálogo</h2>
      <div className="hidden flex-wrap items-start gap-3 md:flex">
        {data && (
          <details className="rounded-lg border border-edge bg-card px-3 text-sm">
            <summary className="cursor-pointer py-3">Séries{search.collection.length ? ` (${search.collection.length})` : ''}</summary>
            <Facet label="Filtrar séries" values={data.facets.collection} selected={search.collection}
              onChange={(collection) => update({ collection })} />
          </details>
        )}
      </div>
      <div className="mobile-catalog-options flex flex-wrap items-center justify-between gap-x-3 text-xs sm:text-sm">
        <div role="group" aria-label="Exibir" className="flex flex-wrap gap-x-2 md:gap-x-4">
          {([['all', 'Todos os NFTs'], ['new', 'Novos lançamentos'], ['trending', 'Em alta']] as const).map(([tab, label]) => (
            <button key={tab} type="button" aria-pressed={search.tab === tab} onClick={() => update({ tab })}
              className="min-h-11 border-b-2 border-transparent aria-pressed:border-accent aria-pressed:text-accent">{label}</button>
          ))}
        </div>
        <label className="flex min-h-11 items-center gap-1">
          Ordenar por
          <select className="min-h-11 min-w-0 rounded-md px-1" value={search.sort}
            onChange={(event) => update({ sort: parseCatalogSearch({ sort: event.target.value }).sort })}>
            <option value="recent">Listados recentemente</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </label>
      </div>
      {loading && <Loading label="Carregando NFTs" count={6} />}
      {query.isError && (
        <>
          <p role="alert">Não foi possível carregar o catálogo.</p>
          <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        </>
      )}
      {!loading && data && (
        <>
          <section aria-label="Resultados do catálogo" className="relative">
            {query.isFetching && <div role="status" className="absolute inset-x-0 -top-2">
              <span className="sr-only">Carregando NFTs</span>
              <div aria-hidden="true" className="skeleton h-0.5 rounded-full" />
            </div>}
            {data.items.length === 0 ? <p role="status">Nenhum NFT encontrado.</p> : (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:gap-x-9 lg:gap-y-12">
                {data.items.map((item) => <NftCardView key={item.id} item={item} />)}
              </ul>
            )}
          </section>
          {(maxPage > 1 || search.page > 1) && (
            <nav aria-label="Paginação do catálogo" className="flex flex-wrap items-center justify-end gap-2">
              {search.page > 1 && <Button variant="outline" aria-label="Anterior" className="size-11 px-0"
                onClick={() => update({ page: Math.min(search.page - 1, maxPage) })}>‹</Button>}
              {Array.from({ length: maxPage }, (_, index) => index + 1).map((page) => (
                <Button key={page} variant={page === search.page ? 'default' : 'outline'} className="size-11 px-0"
                  aria-label={`Página ${page}`} aria-current={page === search.page ? 'page' : undefined}
                  onClick={() => update({ page })}>{page}</Button>
              ))}
              <Button variant="outline" aria-label="Próxima" className="size-11 px-0" disabled={search.page >= maxPage}
                onClick={() => update({ page: search.page + 1 })}>›</Button>
            </nav>
          )}
        </>
      )}
      </div>
      </div>
      <HomeEditorial />
    </section>
  )
}
