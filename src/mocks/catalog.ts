import { delay, http, HttpResponse } from 'msw'
import {
  catalogPageSize, catalogPath, catalogSorts, catalogTabs, parseCatalogSearch,
  type CatalogPage, type CreatorProfile, type NftCard,
} from '../contracts/catalog'
import { priceInWei } from '../contracts/eth'
import { availableStock, settle } from './commerce'
import { transact } from './commerce-store'
import { marketItems } from './market'
import { catalogCategories } from './catalog-state'

const catalogControlPath = '/__demo/catalog'
let scenario = 'default'
let failNext = false

function card({ id, name, category, collection, priceEth, image }: NftCard): NftCard {
  return { id, name, category, collection, priceEth, image }
}

export const catalogHandlers = [
  http.get('/api/v1/creators', () => transact((state) => {
    const items = marketItems(state)
    const profiles = [
      { id: 'ana', name: 'Ana Costa', art: '8f387', nfts: ['emerald-ape-042', 'cosmic-bloom-118'] },
      { id: 'bia', name: 'Bia Ramos', art: '83794', nfts: ['violet-nomad-314', 'ivory-baron-088'] },
      { id: 'leo', name: 'Leo Alves', art: 'b7cfc', nfts: ['golden-beat-207', 'golden-signal-160'] },
    ]
    return HttpResponse.json<CreatorProfile[]>(profiles.map(({ id, name, art, nfts }) => ({
      id, name, handle: '@' + id + '.kurio',
      avatar: { src: '/art/' + art + '-480.webp', alt: 'Avatar ilustrado de ' + name },
      ownedNfts: items.filter((item) => nfts.includes(item.id)).map(card),
    })))
  })),
  http.get(catalogPath, async ({ request }) => {
    const { searchParams: params } = new URL(request.url)
    const page = Number(params.get('page') ?? 1)
    const pageSize = Number(params.get('pageSize') ?? catalogPageSize)
    const tab = params.get('tab')
    const sort = params.get('sort')
    if (!Number.isSafeInteger(page) || page < 1 ||
        !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 48 ||
        (tab !== null && !catalogTabs.some((value) => value === tab)) ||
        (sort !== null && !catalogSorts.some((value) => value === sort))) {
      return HttpResponse.json({ code: 'INVALID_QUERY', message: 'Parâmetros inválidos' }, { status: 400 })
    }
    const search = parseCatalogSearch({
      page, tab, sort,
      q: params.get('q'),
      category: params.getAll('category[]'),
      collection: params.getAll('collection[]'),
      network: params.getAll('network[]'),
      minPrice: params.get('minPrice'),
      maxPrice: params.get('maxPrice'),
    })
    if (failNext) {
      failNext = false
      return HttpResponse.json({ code: 'UNAVAILABLE', message: 'Catálogo indisponível' }, { status: 503 })
    }
    if (scenario === 'slow') await delay(search.q === 'Emerald' ? 1200 : 80)

    return transact((state) => {
      const items = marketItems(state)
      const term = search.q.toLocaleLowerCase('pt-BR')
      const minPrice = search.minPrice ? priceInWei(search.minPrice) : null
      const maxPrice = search.maxPrice ? priceInWei(search.maxPrice) : null
      const results = items.filter((item) =>
        (!term || item.name.toLocaleLowerCase('pt-BR').includes(term)) &&
        (search.tab !== 'new' || item.listedAt > items.length - 6) &&
        (search.tab !== 'trending' || item.trending) &&
        (!search.category.length || search.category.includes(item.category)) &&
        (!search.collection.length || search.collection.includes(item.collection)) &&
        (!search.network.length || search.network.includes(item.network)) &&
        (minPrice === null || priceInWei(item.priceEth) >= minPrice) &&
        (maxPrice === null || priceInWei(item.priceEth) <= maxPrice),
      )
      results.sort((left, right) => {
        if (search.sort !== 'recent') {
          const delta = priceInWei(left.priceEth) - priceInWei(right.priceEth)
          if (delta !== 0n) return (delta < 0n ? -1 : 1) * (search.sort === 'price-asc' ? 1 : -1)
        } else if (left.listedAt !== right.listedAt) {
          return right.listedAt - left.listedAt
        }
        return left.id.localeCompare(right.id)
      })
      const start = (page - 1) * pageSize
      return HttpResponse.json<CatalogPage>({
        items: results.slice(start, start + pageSize).map(card),
        highlights: items.filter((item) => item.highlighted).map(card),
        facets: {
          category: catalogCategories,
          collection: [...new Set(items.map((item) => item.collection))].sort(),
          network: [...new Set(items.map((item) => item.network))].sort(),
        },
        facetCounts: {
          category: Object.fromEntries(catalogCategories.map((name) => [name, items.filter((item) => item.category === name).length])),
          network: Object.fromEntries([...new Set(items.map((item) => item.network))]
            .map((name) => [name, items.filter((item) => item.network === name).length])),
        },
        total: results.length, page, pageSize, catalogVersion: state.catalogVersion,
      })
    })
  }),
  http.get(`${catalogPath}/:id`, ({ params }) => {
    return transact((state) => {
      settle(state)
      const item = marketItems(state).find((nft) => nft.id === params.id)
      if (!item) return HttpResponse.json({ code: 'NFT_NOT_FOUND', message: 'NFT não encontrado' }, { status: 404 })
      const { description, tokenId, version, gallery, editions, network, attributes, details, rating } = item
      return HttpResponse.json({
        ...card(item), description, tokenId, version, gallery, network, attributes, details, rating,
        editions: editions.map((edition) => ({
          ...edition, available: availableStock(state, item.id, edition.id, edition.available),
        })),
      })
    })
  }),
  http.post(catalogControlPath, async ({ request }) => {
    const body: unknown = await request.json()
    if (body === 'fail-next') failNext = true
    else if (body === 'slow' || body === 'default') {
      scenario = body
      failNext = false
    } else return HttpResponse.json({ code: 'INVALID_SCENARIO' }, { status: 400 })
    return new HttpResponse(null, { status: 204 })
  }),
]
