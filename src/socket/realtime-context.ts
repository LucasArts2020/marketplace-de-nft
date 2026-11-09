import { createContext, useContext } from 'react'
import type { NftUpdated } from '../contracts/realtime'

export const initialRealtime = {
  connected: false,
  market: {} as Record<string, NftUpdated>,
}

export const RealtimeContext = createContext(initialRealtime)

export function useRealtime() {
  return useContext(RealtimeContext)
}
