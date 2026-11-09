export const catalogPath = '/api/v1/nfts'
export const catalogPageSize = 9

export const catalogTabs = ['all', 'new', 'trending'] as const
export const catalogSorts = ['recent', 'price-asc', 'price-desc'] as const

export interface CatalogSearch {
  q: string
  tab: typeof catalogTabs[number]
  sort: typeof catalogSorts[number]
  category: string[]
  collection: string[]
  network: string[]
  minPrice: string
  maxPrice: string
  page: number
}

function facet(value: unknown): string[] {
  const list = Array.isArray(value) ? value : [value]
  return [...new Set(list.filter((item): item is string => typeof item === 'string' && item !== ''))].sort()
}

export function parseCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const page = typeof search.page === 'number' || typeof search.page === 'string'
    ? Number(search.page)
    : 1
  const price = (value: unknown) => {
    const input = typeof value === 'number' || typeof value === 'string' ? String(value).replace(',', '.') : ''
    return /^\d{1,12}(?:\.\d{1,18})?$/.test(input) ? input : ''
  }
  return {
    q: typeof search.q === 'string' ? search.q.trim() : '',
    tab: catalogTabs.find((tab) => tab === search.tab) ?? 'all',
    sort: catalogSorts.find((sort) => sort === search.sort) ?? 'recent',
    category: facet(search.category),
    collection: facet(search.collection),
    network: facet(search.network),
    minPrice: price(search.minPrice),
    maxPrice: price(search.maxPrice),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  }
}

export interface NftCard {
  id: string
  name: string
  category: string
  collection: string
  priceEth: string
  image: NftImage
}

export interface NftImage {
  src: string
  alt: string
}

export interface CreatorProfile {
  id: string
  name: string
  handle: string
  avatar: NftImage
  ownedNfts: NftCard[]
}

export interface NftEdition {
  id: string
  label: string
  priceEth: string
  available: number
  version: number
}

export interface NftDetail extends NftCard {
  description: string
  tokenId: string
  version: number
  gallery: NftImage[]
  editions: NftEdition[]
  network: string
  attributes?: string[]
  details?: string[]
  rating?: { score: number; count: number }
}

export interface CatalogPage {
  items: NftCard[]
  highlights: NftCard[]
  facets: { category: string[]; collection: string[]; network: string[] }
  facetCounts: { category: Record<string, number>; network: Record<string, number> }
  total: number
  page: number
  pageSize: number
  catalogVersion: number
}
