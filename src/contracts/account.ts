export const profileFields = [
  ['displayName', 'Nome de exibição'], ['username', 'Nome de usuário'],
  ['email', 'E-mail'], ['ensName', 'Nome ENS'], ['walletNickname', 'Apelido da carteira'],
] as const

export type Profile = Record<typeof profileFields[number][0], string> & { avatar: string | null }

export const walletProviders = ['MetaMask', 'WalletConnect', 'Coinbase Wallet'] as const
export const walletSlots = ['primary', 'secondary'] as const

export interface WalletSettings {
  id: string
  provider: string
  address: string
  networks: string[]
  displayName?: string
  nickname?: string
  profileName?: string
  email?: string
  ensName?: string
  referralCode?: string
  alternateWalletReference?: string
}
