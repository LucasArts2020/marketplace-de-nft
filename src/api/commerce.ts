import { cartPath, defaultNetwork, type Cart, type CartChange, type LoginResult, type Quote, type Session } from '../contracts/cart'
import { http } from './http'

const guestStorage = 'kurio.guest'
let guestCreation: Promise<string> | undefined

function getGuestToken(): Promise<string> {
  guestCreation ??= navigator.locks.request('kurio-guest-bootstrap', async () => {
    const existing = localStorage.getItem(guestStorage)
    if (existing) return existing
    const { data } = await http.post<{ token: string }>('/api/v1/guest-carts')
    localStorage.setItem(guestStorage, data.token)
    return data.token
  }).finally(() => { guestCreation = undefined })
  return guestCreation
}

async function cartHeaders(token: string | null) {
  return token ? { Authorization: 'Bearer ' + token } : { 'X-Guest-Cart': await getGuestToken() }
}

export async function login(email: string, password: string, username?: string) {
  const guest = guestCreation ? await guestCreation : localStorage.getItem(guestStorage)
  const path = username === undefined ? '/api/v1/auth/login' : '/api/v1/auth/register'
  const { data } = await http.post<LoginResult>(path, { email, password, username }, {
    headers: guest ? { 'X-Guest-Cart': guest } : {},
  })
  if (guest === localStorage.getItem(guestStorage)) localStorage.removeItem(guestStorage)
  return data
}

export async function getSession(token: string, signal: AbortSignal) {
  return (await http.get<Session>('/api/v1/session', {
    signal, headers: { Authorization: 'Bearer ' + token },
  })).data
}

export async function logout(token: string) {
  await http.post('/api/v1/auth/logout', undefined, { headers: { Authorization: 'Bearer ' + token } })
}

export async function getCart(token: string | null, signal: AbortSignal) {
  const headers = await cartHeaders(token)
  return (await http.get<Cart>(cartPath, { signal, headers })).data
}

export async function quoteCart(token: string | null, cartVersion: number, signal?: AbortSignal, networkId = defaultNetwork) {
  const headers = await cartHeaders(token)
  return (await http.post<Quote>('/api/v1/quotes', { cartVersion, networkId }, { signal, headers })).data
}

export async function changeCart(token: string | null, cartVersion: number, change: CartChange) {
  const headers = await cartHeaders(token)
  switch (change.kind) {
    case 'add': {
      const { nftId, editionId, quantity } = change
      return (await http.post<Cart>(cartPath + '/items', { nftId, editionId, quantity, cartVersion }, { headers })).data
    }
    case 'quantity':
      return (await http.patch<Cart>(cartPath + '/items/' + encodeURIComponent(change.lineId),
        { quantity: change.quantity, cartVersion }, { headers })).data
    case 'remove':
      return (await http.delete<Cart>(cartPath + '/items/' + encodeURIComponent(change.lineId),
        { headers: { ...headers, 'If-Match': String(cartVersion) } })).data
    case 'coupon':
      return (await http.put<Cart>(cartPath + '/coupon', { code: change.code, cartVersion }, { headers })).data
    case 'clear-coupon':
      return (await http.delete<Cart>(cartPath + '/coupon', { headers: { ...headers, 'If-Match': String(cartVersion) } })).data
  }
}
