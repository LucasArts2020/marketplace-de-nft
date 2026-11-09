import axios from 'axios'
import { useSession } from './session'

export function useAccountData() {
  const { identity, expire, active } = useSession()
  const prefix = ['private', identity.generation] as const

  async function request<T>(action: (token: string) => Promise<T>): Promise<T> {
    if (!identity.token || !active(identity.generation)) throw new Error('Sua sessão expirou.')
    try {
      return await action(identity.token)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) expire(identity.generation)
      throw error
    }
  }

  return { request, prefix, isCurrent: () => active(identity.generation) }
}
