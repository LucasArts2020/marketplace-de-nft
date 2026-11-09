import type { Quote } from './cart'

export const collectorFields = [
  ['displayName', 'Nome de exibição'], ['username', 'Nome de usuário'],
  ['profileName', 'Nome do perfil'], ['email', 'E-mail'],
  ['referralCode', 'Código de indicação'], ['ensName', 'Nome ENS'],
  ['alternateWalletReference', 'ENS ou carteira secundária'], ['note', 'Observação do colecionador'],
] as const

export type Collector = Record<typeof collectorFields[number][0], string>

export function parseCollector(value: unknown): Collector | undefined {
  if (!value || typeof value !== 'object') return undefined
  const source = value as Record<string, unknown>
  const result = {} as Collector
  for (const [key] of collectorFields) {
    const raw = source[key]
    const text = typeof raw === 'string' ? raw.trim() : ''
    if (text.length > 250 || (!text && key !== 'note' && key !== 'alternateWalletReference')) return undefined
    result[key] = text
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) return undefined
  return result
}

export interface Wallet {
  id: string
  provider: string
  address: string
  networks: string[]
}

export interface WalletConnection {
  id: string
  wallet: Wallet
  networkId: string
}

export interface OrderRequest {
  quoteId: string
  connectionId: string
  collector: Collector
}

export interface Order {
  id: string
  version: number
  status: 'pending' | 'confirmed' | 'rejected'
  reason?: string
  receipt?: {
    transactionId: string
    confirmedAt: string
    wallet: Wallet
    quote: Quote
  }
}
