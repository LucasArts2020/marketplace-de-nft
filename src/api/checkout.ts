import type { Order, OrderRequest, Wallet, WalletConnection } from '../contracts/checkout'
import { http } from './http'

function auth(token: string) {
  return { Authorization: 'Bearer ' + token }
}

export async function getWallets(token: string, signal: AbortSignal) {
  return (await http.get<Wallet[]>('/api/v1/wallets', { headers: auth(token), signal })).data
}

export async function connectWallet(token: string, walletId: string, networkId: string) {
  return (await http.post<WalletConnection>('/api/v1/wallet-connections', { walletId, networkId }, { headers: auth(token) })).data
}

export async function disconnectWallet(token: string, id: string) {
  await http.delete('/api/v1/wallet-connections/' + encodeURIComponent(id), { headers: auth(token) })
}

export async function createOrder(token: string, key: string, body: OrderRequest) {
  return (await http.post<Order>('/api/v1/orders', body, { headers: { ...auth(token), 'Idempotency-Key': key } })).data
}

export async function getOrder(token: string, id: string, signal: AbortSignal) {
  return (await http.get<Order>('/api/v1/orders/' + encodeURIComponent(id), { headers: auth(token), signal })).data
}

export async function getAttempt(token: string, key: string) {
  return (await http.get<Order>('/api/v1/order-attempts/' + encodeURIComponent(key), { headers: auth(token) })).data
}
