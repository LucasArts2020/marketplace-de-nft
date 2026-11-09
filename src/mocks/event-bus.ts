import type { MarketEvent } from '../contracts/realtime'

export interface Delivery {
  event: MarketEvent
  owner?: string
}

const channel = new BroadcastChannel('kurio-mock-events')
const listeners = new Set<(delivery: Delivery) => void>()

function deliver(delivery: Delivery) {
  for (const listener of listeners) listener(delivery)
}

channel.onmessage = (message: MessageEvent<Delivery>) => deliver(message.data)

export function publish(delivery: Delivery) {
  deliver(delivery)
  channel.postMessage(delivery)
}

export function onDelivery(listener: (delivery: Delivery) => void) {
  listeners.add(listener)
}
