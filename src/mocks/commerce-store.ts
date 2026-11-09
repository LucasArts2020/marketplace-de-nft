import type { Quote } from '../contracts/cart'
import type { Order, WalletConnection } from '../contracts/checkout'
import type { Profile, WalletSettings } from '../contracts/account'
import type { NftEdition } from '../contracts/catalog'
import { publish, type Delivery } from './event-bus'

export interface StoredAccount extends Profile {
  id: string
  salt: string
  hash: string
}

interface StoredLine {
  nftId: string
  editionId: string
  quantity: number
}

export interface StoredCart {
  id: string
  version: number
  couponCode?: string
  lines: Record<string, StoredLine>
}

export interface CommerceState {
  carts: Record<string, StoredCart>
  sessions: Record<string, { userId: string; expiresAt: number }>
  quotes: Record<string, Quote>
  connections: Record<string, WalletConnection & { token: string }>
  orders: Record<string, StoredOrder>
  accounts: Record<string, StoredAccount>
  wallets: Record<string, WalletSettings[]>
  favorites: Record<string, string[]>
  catalogVersion: number
  market: Record<string, Record<string, NftEdition>>
}

export interface StoredOrder {
  order: Order
  owner: string
  key: string
  fingerprint: string
  quote: Quote
  wallet: WalletConnection['wallet']
  dueAt: number
  reject: boolean
}

let database: Promise<IDBDatabase> | undefined

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('kurio-demo-commerce', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('commerce')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return database
}

export function newCart(): StoredCart {
  return { id: crypto.randomUUID(), version: 1, lines: {} }
}

const deliveries = new WeakMap<CommerceState, Delivery[]>()

function initialState(): CommerceState {
  return {
    carts: {}, sessions: {}, quotes: {}, connections: {}, orders: {},
    accounts: {}, wallets: {}, favorites: {}, catalogVersion: 1, market: {},
  }
}

export async function resetCommerce() {
  await transact((state) => Object.assign(state, initialState()))
}

export function queueDelivery(state: CommerceState, delivery: Delivery) {
  deliveries.get(state)?.push(delivery)
}

export async function transact<T>(operation: (state: CommerceState) => T): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('commerce', 'readwrite')
    const store = transaction.objectStore('commerce')
    const request = store.get('state')
    let result: T
    let failure: unknown
    const committedEvents: Delivery[] = []
    request.onsuccess = () => {
      const state: CommerceState = { ...initialState(), ...request.result }
      try {
        deliveries.set(state, committedEvents)
        result = operation(state)
        store.put(state, 'state')
      } catch (error) {
        failure = error
        transaction.abort()
      }
    }
    transaction.oncomplete = () => {
      for (const delivery of committedEvents) publish(delivery)
      resolve(result)
    }
    transaction.onabort = () => reject(failure ?? transaction.error)
  })
}
