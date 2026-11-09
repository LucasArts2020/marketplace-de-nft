import type { Profile, WalletSettings } from '../contracts/account'
import { http } from './http'

function auth(token: string) {
  return { Authorization: 'Bearer ' + token }
}

export async function getProfile(token: string, signal: AbortSignal) {
  return (await http.get<Profile>('/api/v1/profile', { headers: auth(token), signal })).data
}

export async function saveProfile(token: string, profile: Profile) {
  return (await http.patch<Profile>('/api/v1/profile', profile, { headers: auth(token) })).data
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  await http.put('/api/v1/profile/password', { currentPassword, newPassword }, { headers: auth(token) })
}

export async function getWalletSettings(token: string, signal: AbortSignal) {
  return (await http.get<WalletSettings[]>('/api/v1/wallets', { headers: auth(token), signal })).data
}

export async function saveWalletSettings(token: string, slot: string, exists: boolean, fields: FormData) {
  const data = { ...Object.fromEntries(fields), slot }
  if (exists) await http.patch('/api/v1/wallets/' + encodeURIComponent(slot), data, { headers: auth(token) })
  else await http.post('/api/v1/wallets', data, { headers: auth(token) })
}

export async function getFavorites(token: string, signal: AbortSignal) {
  return (await http.get<string[]>('/api/v1/favorites', { headers: auth(token), signal })).data
}

export async function updateFavorite(token: string, nftId: string, favorite: boolean) {
  const path = '/api/v1/favorites/' + encodeURIComponent(nftId)
  if (favorite) await http.put(path, undefined, { headers: auth(token) })
  else await http.delete(path, { headers: auth(token) })
}
