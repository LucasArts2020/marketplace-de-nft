import type { NftImage } from './catalog'

export const cartPath = '/api/v1/cart'
export const defaultNetwork = 'ethereum'

export interface Session {
  user: { id: string; username: string }
  expiresAt: string
}

export interface LoginResult extends Session {
  token: string
  alerts: string[]
}

export interface CartLine {
  lineId: string
  nftId: string
  editionId: string
  name: string
  image?: NftImage
  editionLabel: string
  priceEth: string
  quantity: number
  reservedQuantity: number
  available: number
  editionVersion: number
}

export interface Cart {
  id: string
  version: number
  couponCode?: string
  pendingOrderId?: string
  lines: CartLine[]
}

export interface Quote {
  id: string
  cartId: string
  cartVersion: number
  catalogVersion: number
  networkId: string
  expiresAt: string
  lines: CartLine[]
  couponCode?: string
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export type CartChange =
  | { kind: 'add'; nftId: string; editionId: string; quantity: number }
  | { kind: 'quantity'; lineId: string; quantity: number }
  | { kind: 'remove'; lineId: string }
  | { kind: 'coupon'; code: string }
  | { kind: 'clear-coupon' }
