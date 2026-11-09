import { catalogPageSize, catalogPath, type CatalogPage, type CatalogSearch, type NftDetail } from '../contracts/catalog'
import { http } from './http'

export async function listCatalog(search: CatalogSearch, signal: AbortSignal): Promise<CatalogPage> {
  const params = new URLSearchParams({
    page: String(search.page),
    pageSize: String(catalogPageSize),
  })
  if (search.q) params.set('q', search.q)
  if (search.tab !== 'all') params.set('tab', search.tab)
  if (search.sort !== 'recent') params.set('sort', search.sort)
  search.category.forEach((category) => params.append('category[]', category))
  search.collection.forEach((collection) => params.append('collection[]', collection))
  search.network.forEach((network) => params.append('network[]', network))
  if (search.minPrice) params.set('minPrice', search.minPrice)
  if (search.maxPrice) params.set('maxPrice', search.maxPrice)
  const { data } = await http.get<CatalogPage>(catalogPath, {
    params,
    signal,
  })
  return data
}

export async function getNft(id: string, signal: AbortSignal): Promise<NftDetail> {
  const { data } = await http.get<NftDetail>(`${catalogPath}/${encodeURIComponent(id)}`, { signal })
  return data
}
