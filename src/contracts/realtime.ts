export const socketPath = '/socket.io'
export const socketControlPath = '/__demo/socket'

import type { Order } from './checkout'

interface EventEnvelope {
  eventId: string
  resourceId: string
  version: number
  occurredAt: string
}

export interface NftUpdated extends EventEnvelope {
  type: 'nft.updated'
  payload: {
    catalogVersion: number
    editions?: { editionId: string; priceEth: string; available: number }[]
  }
}

export interface OrderUpdated extends EventEnvelope {
  type: 'order.updated'
  payload: { status: Order['status']; reason?: string }
}

export type MarketEvent = NftUpdated | OrderUpdated
