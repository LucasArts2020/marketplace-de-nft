import { toSocketIo } from '@mswjs/socket.io-binding'
import { http, HttpResponse, ws } from 'msw'
import { socketControlPath, type MarketEvent, type NftUpdated } from '../contracts/realtime'
import { catalogState } from './catalog-state'
import { transact } from './commerce-store'
import { onDelivery, publish } from './event-bus'
import { updateMarket } from './market'
import { resumePendingOrders } from './commerce'

const endpoint = new URL('/', location.origin)
endpoint.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
// MSW removes the default /socket.io/ transport path before matching.
const socketLink = ws.link(endpoint.href)

interface Connection {
  publish: (event: MarketEvent) => void
  close: () => void
  token?: string
}

const connections = new Set<Connection>()
let offline = false
let lastMarketEvent: NftUpdated | undefined

onDelivery(({ event, owner }) => {
  if (!owner) {
    for (const connection of connections) connection.publish(event)
    return
  }
  void transact((state) => Object.entries(state.sessions)
    .filter(([, session]) => session.userId === owner && session.expiresAt > Date.now())
    .map(([token]) => token)).then((tokens) => {
      for (const connection of connections) {
        if (connection.token && tokens.includes(connection.token)) connection.publish(event)
      }
    }).catch(console.error)
})

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    if (offline) {
      connection.client.close(1012, 'Demo offline')
      return
    }
    const { client } = toSocketIo(connection)
    const active: Connection = {
      publish: (event) => client.emit(event.type, event),
      close: () => connection.client.close(1012, 'Demo connection interrupted'),
    }
    connections.add(active)
    client.on('session.subscribe', (_event, token: unknown) => {
      active.token = undefined
      if (token === null) {
        client.emit('session.ready')
        return
      }
      if (typeof token !== 'string') return
      void transact((state) => Object.hasOwn(state.sessions, token) && state.sessions[token].expiresAt > Date.now())
        .then((valid) => {
          if (!connections.has(active)) return
          if (valid) {
            active.token = token
            client.emit('session.ready')
            void resumePendingOrders().catch(console.error)
          } else client.emit('session.invalid')
        }).catch(console.error)
    })
    connection.client.addEventListener('close', () => connections.delete(active), { once: true })

    // The published binding handles framing and handshake. Complete the
    // Engine.IO v4 heartbeat for demo connections that stay open.
    const heartbeat = setInterval(() => connection.client.send('2'), 20_000)
    connection.client.addEventListener('close', () => clearInterval(heartbeat), { once: true })
  }),
  http.post(socketControlPath, async ({ request }) => {
    const command: unknown = await request.json().catch(() => null)
    if (command === 'interrupt' || command === 'offline') {
      offline = command === 'offline'
      for (const connection of connections) connection.close()
      return new HttpResponse(null, { status: 204 })
    }
    if (command === 'online') {
      offline = false
      return new HttpResponse(null, { status: 204 })
    }
    if ((command === 'replay' || command === 'older') && lastMarketEvent) {
      const event = command === 'replay' ? lastMarketEvent : {
        ...lastMarketEvent, version: lastMarketEvent.version - 1, eventId: lastMarketEvent.eventId + ':older',
      }
      publish({ event })
      return new HttpResponse(null, { status: 204 })
    }
    if (command === 'publish') {
      lastMarketEvent = await transact((state) => updateMarket(state, catalogState.items[0].id))
      return new HttpResponse(null, { status: 204 })
    }
    if (command && typeof command === 'object') {
      const { nftId, editionId, priceEth, available } = command as Record<string, unknown>
      const validPrice = typeof priceEth === 'string' && /^\d{1,12}(?:\.\d{1,18})?$/.test(priceEth)
      const validStock = typeof available === 'number' && Number.isSafeInteger(available) && available >= 0
      if (typeof nftId === 'string' && typeof editionId === 'string' &&
          (priceEth === undefined || validPrice) && (available === undefined || validStock) && (validPrice || validStock)) {
        lastMarketEvent = await transact((state) => updateMarket(state, nftId, editionId, {
          ...(validPrice ? { priceEth } : {}),
          ...(validStock ? { available } : {}),
        }))
        if (lastMarketEvent) return new HttpResponse(null, { status: 204 })
      }
    }
    return HttpResponse.json({ code: 'INVALID_COMMAND' }, { status: 400 })
  }),
]
