import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import axios from 'axios'
import { getSession, login, logout } from '../api/commerce'
import type { Session } from '../contracts/cart'

const storageKey = 'kurio.session'

interface Identity {
  token: string | null
  generation: number
}

interface SessionContext {
  identity: Identity
  active: (generation: number) => boolean
  session?: Session
  validating: boolean
  error: Error | null
  alerts: string[]
  signIn: (email: string, password: string, username?: string) => Promise<void>
  signOut: () => Promise<void>
  expire: (generation: number) => void
}

const Context = createContext<SessionContext | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient()
  const [identity, setIdentity] = useState<Identity>(() => ({ token: localStorage.getItem(storageKey), generation: 0 }))
  const [alerts, setAlerts] = useState<string[]>([])
  const current = useRef(identity)
  const loginMutation = useMutation({
    gcTime: 0,
    mutationFn: ({ email, password, username }: { email: string; password: string; username?: string }) =>
      login(email, password, username),
  })
  const logoutMutation = useMutation({ gcTime: 0, mutationFn: logout })

  function switchIdentity(token: string | null) {
    if (current.current.token === token) return
    const next = { token, generation: current.current.generation + 1 }
    current.current = next
    setIdentity(next)
    void cache.cancelQueries({ queryKey: ['private'] })
    cache.removeQueries({ queryKey: ['private'] })
  }

  function saveIdentity(token: string | null) {
    if (token) localStorage.setItem(storageKey, token)
    else localStorage.removeItem(storageKey)
    switchIdentity(token)
  }

  function expire(generation: number) {
    if (current.current.generation !== generation || !current.current.token) return
    setAlerts(['Sua sessão expirou. Entre novamente para recuperar seu carrinho.'])
    saveIdentity(null)
  }

  const session = useQuery({
    queryKey: ['private', identity.generation, 'session'],
    queryFn: ({ signal }) => getSession(identity.token!, signal),
    enabled: Boolean(identity.token),
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    if (axios.isAxiosError(session.error) && session.error.response?.status === 401) expire(identity.generation)
  })

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== storageKey && event.key !== null) return
      setAlerts([])
      switchIdentity(localStorage.getItem(storageKey))
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  })

  return (
    <Context.Provider value={{
      identity,
      active: (generation) => current.current.generation === generation,
      session: session.isError ? undefined : session.data,
      validating: Boolean(identity.token) && session.isPending,
      error: session.error,
      alerts,
      expire,
      async signIn(email, password, username) {
        const generation = current.current.generation
        try {
          const result = await loginMutation.mutateAsync({ email, password, username })
          if (current.current.generation !== generation) return
          setAlerts(result.alerts)
          saveIdentity(result.token)
          cache.setQueryData(['private', current.current.generation, 'session'], {
            user: result.user, expiresAt: result.expiresAt,
          })
        } finally {
          loginMutation.reset()
        }
      },
      async signOut() {
        const { token, generation } = current.current
        if (!token) return
        try {
          await logoutMutation.mutateAsync(token)
          if (current.current.generation === generation) {
            if (session.data) sessionStorage.removeItem('kurio.checkout-draft.' + session.data.user.id)
            setAlerts([])
            saveIdentity(null)
          }
        } finally {
          logoutMutation.reset()
        }
      },
    }}>
      {children}
    </Context.Provider>
  )
}

export function useSession() {
  const session = useContext(Context)
  if (!session) throw new Error('SessionProvider is required')
  return session
}
