import type { NftEdition } from '../contracts/catalog'
import type { NftUpdated } from '../contracts/realtime'
import { catalogState } from './catalog-state'
import { queueDelivery, type CommerceState } from './commerce-store'

export function marketItems(state: CommerceState) {
  return catalogState.items.map((item) => {
    const overrides = state.market[item.id]
    if (!overrides) return item
    const editions = item.editions.map((edition) => overrides[edition.id] ?? edition)
    return {
      ...item, editions, priceEth: editions[0].priceEth,
      version: Math.max(item.version, ...editions.map((edition) => edition.version)),
    }
  })
}

export function updateMarket(state: CommerceState, nftId: string, editionId?: string, changes?: {
  priceEth?: string
  available?: number
}): NftUpdated | undefined {
  const item = marketItems(state).find((nft) => nft.id === nftId)
  const edition = item?.editions.find((entry) => entry.id === editionId)
  if (!item || (editionId && !edition)) return undefined
  const version = ++state.catalogVersion
  let updated: NftEdition | undefined
  if (edition && changes) {
    updated = { ...edition, ...changes, version }
    const overrides = state.market[nftId] ??= {}
    overrides[edition.id] = updated
  }
  const event: NftUpdated = {
    eventId: `nft:${nftId}:${version}`, type: 'nft.updated', resourceId: nftId, version,
    occurredAt: new Date().toISOString(),
    payload: {
      catalogVersion: version,
      editions: updated ? [{ editionId: updated.id, priceEth: updated.priceEth, available: updated.available }] : undefined,
    },
  }
  queueDelivery(state, { event })
  return event
}
