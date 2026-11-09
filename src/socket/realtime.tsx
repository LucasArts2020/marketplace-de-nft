import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { io } from 'socket.io-client'
import { socketPath, type MarketEvent } from '../contracts/realtime'
import { useSession } from '../commerce/session'

import { initialRealtime as initial, RealtimeContext } from './realtime-context'

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { identity } = useSession()
  const cache = useQueryClient()
  const [snapshot, setSnapshot] = useState({ generation: identity.generation, ...initial })

  useEffect(() => {
    const { generation, token } = identity
    const prefix = ['private', generation] as const
    let alive = true
    let connectedBefore = false
    let interrupted = false
    const versions = new Map<string, number>()
    setSnapshot({ generation, ...initial })

    const socket = io({
      path: socketPath,
      transports: ['websocket'],
      forceNew: true,
      reconnectionDelay: 400,
      reconnectionDelayMax: 1500,
      randomizationFactor: 0,
    })

    async function reconcile(keys: readonly (readonly unknown[])[]) {
      await Promise.all(keys.map((queryKey) => cache.cancelQueries({ queryKey })))
      if (!alive) return
      await Promise.all(keys.map((queryKey) => cache.invalidateQueries({ queryKey })))
    }

    function receive(event: MarketEvent) {
      if (!alive || !event?.resourceId || !Number.isSafeInteger(event.version) || event.version < 1) return
      const key = event.type + ':' + event.resourceId
      if (event.version <= (versions.get(key) ?? 0)) return
      versions.set(key, event.version)
      if (event.type === 'nft.updated') {
        setSnapshot((current) => ({
          ...current, market: { ...current.market, [event.resourceId]: event },
        }))
        void reconcile([['catalog'], ['nft', event.resourceId], [...prefix, 'cart'], [...prefix, 'quote']])
      } else if (event.type === 'order.updated' && token) {
        void reconcile([[...prefix, 'order', event.resourceId], [...prefix, 'cart'], [...prefix, 'quote']])
      }
    }

    socket.on('connect', () => socket.emit('session.subscribe', token))
    socket.on('session.ready', () => {
      if (!alive) return
      setSnapshot((current) => ({ ...current, connected: true }))
      if (connectedBefore || interrupted) void reconcile([['catalog'], ['nft'], prefix])
      connectedBefore = true
    })
    socket.on('session.invalid', () => void cache.invalidateQueries({ queryKey: [...prefix, 'session'] }))
    socket.on('connect_error', () => { interrupted = true })
    socket.on('disconnect', () => {
      interrupted = true
      if (alive) setSnapshot((current) => ({ ...current, connected: false }))
    })
    socket.on('nft.updated', receive)
    socket.on('order.updated', receive)
    return () => {
      alive = false
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [cache, identity])

  return <RealtimeContext.Provider value={snapshot.generation === identity.generation ? snapshot : initial}>
    {children}
  </RealtimeContext.Provider>
}
