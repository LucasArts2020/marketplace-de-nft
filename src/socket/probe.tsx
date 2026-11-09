import axios from 'axios'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { Button } from '../components/ui/button'
import { socketControlPath, socketPath, type NftUpdated } from '../contracts/realtime'

export function SocketProbe() {
  const [connected, setConnected] = useState(false)
  const [connections, setConnections] = useState(0)
  const [version, setVersion] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    const socket = io({
      path: socketPath,
      transports: ['websocket'],
      reconnectionDelay: 400,
      randomizationFactor: 0,
    })
    socket.on('connect', () => {
      setConnected(true)
      setConnections((count) => count + 1)
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('nft.updated', (event: NftUpdated) => {
      setVersion((current) => Math.max(current, event.version))
    })
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [])

  async function send(command: 'publish' | 'interrupt') {
    setError(false)
    try {
      await axios.post(socketControlPath, JSON.stringify(command), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      setError(true)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Verificação do Socket.IO</h2>
      <p role="status">{connected ? 'Conectado' : 'Desconectado'}</p>
      <p>Conexões estabelecidas: {connections}</p>
      <p>Versão recebida: {version}</p>
      {error && <p role="alert">Não foi possível acionar a simulação.</p>}
      <div className="flex flex-wrap gap-3">
        <Button disabled={!connected} onClick={() => void send('publish')}>Publicar evento</Button>
        <Button disabled={!connected} variant="outline" onClick={() => void send('interrupt')}>
          Interromper conexão
        </Button>
      </div>
    </section>
  )
}
