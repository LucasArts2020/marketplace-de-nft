import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { changeCart, getCart, quoteCart } from '../api/commerce'
import type { Cart, CartChange } from '../contracts/cart'
import { useSession } from './session'

export function useCart(withQuote = false) {
  const cache = useQueryClient()
  const { identity, active, expire, validating, error } = useSession()
  const { token, generation } = identity
  const prefix = ['private', generation] as const
  const cartKey = [...prefix, 'cart'] as const
  const enabled = !validating && !error
  const cart = useQuery({
    queryKey: cartKey,
    queryFn: async ({ signal }) => {
      try {
        return await getCart(token, signal)
      } catch (error) {
        if (token && axios.isAxiosError(error) && error.response?.status === 401) expire(generation)
        throw error
      }
    },
    enabled,
    retry: false,
    staleTime: 10_000,
  })
  const version = cart.data?.version
  const quote = useQuery({
    queryKey: [...prefix, 'quote', version],
    queryFn: async ({ signal }) => {
      try {
        return await quoteCart(token, version!, signal)
      } catch (error) {
        if (token && axios.isAxiosError(error) && error.response?.status === 401) expire(generation)
        throw error
      }
    },
    enabled: enabled && withQuote && !cart.isError && Boolean(cart.data?.lines.length),
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: async (change: CartChange) => {
      const current = cache.getQueryData<Cart>(cartKey)
      if (!current || !active(generation)) throw new Error('Carrinho indisponível.')
      return changeCart(token, current.version, change)
    },
    async onSuccess(updated) {
      if (!active(generation)) return
      await cache.cancelQueries({ queryKey: cartKey })
      if (!active(generation)) return
      cache.setQueryData<Cart>(cartKey, (current) =>
        !current || current.version <= updated.version ? updated : current)
    },
    onError(error) {
      if (!active(generation) || !axios.isAxiosError(error)) return
      if (token && error.response?.status === 401) expire(generation)
      if (error.response?.status === 409) void cache.invalidateQueries({ queryKey: cartKey })
    },
  })
  return { cart, quote, mutation, enabled, generation }
}
