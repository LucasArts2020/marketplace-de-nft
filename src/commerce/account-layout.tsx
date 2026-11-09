import { Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { errorMessage } from '../api/http'
import { useSession } from './session'

export const accountInput = 'min-h-10 w-full min-w-0 rounded border border-edge bg-ink px-3 text-sm'

export function AccountLayout({ children }: { children: ReactNode }) {
  const { signOut } = useSession()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const linkStyle = 'flex min-h-10 items-center gap-3 border-l-4 border-transparent px-3 text-sm text-accent data-[status=active]:border-primary data-[status=active]:bg-surface'

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(170px,26%)_minmax(0,1fr)]">
      <aside className="bg-card">
        <h2 className="px-4 pt-4 pb-2 text-base font-bold">Meu perfil</h2>
        <nav aria-label="Área do colecionador" className="grid">
          <Link to="/profile" className={linkStyle}><span aria-hidden="true">♙</span>Dados do perfil</Link>
          <Link to="/wallets" className={linkStyle}><span aria-hidden="true">◇</span>Carteiras</Link>
          <span aria-disabled="true" className={linkStyle}><span aria-hidden="true">◷</span>Atividade</span>
          <Link to="/favorites" aria-label="Lista de interesse, Favoritos" className={linkStyle}><span aria-hidden="true">♡</span>Lista de interesse</Link>
          <span aria-disabled="true" className={linkStyle}><span aria-hidden="true">↗</span>Ofertas</span>
          <span aria-disabled="true" className={linkStyle}><span aria-hidden="true">⇩</span>Arquivos baixados</span>
          <span aria-disabled="true" className={linkStyle}><span aria-hidden="true">△</span>Suporte</span>
        </nav>
        <button type="button" disabled={busy} className="mt-1 flex min-h-11 w-full items-center gap-3 border-t border-edge px-4 text-sm text-accent"
          onClick={async () => {
            setBusy(true)
            setError('')
            try { await signOut() } catch (error) {
              setError(errorMessage(error, 'Não foi possível sair.'))
            } finally { setBusy(false) }
          }}><span aria-hidden="true">↪</span>Sair</button>
        {error && <p role="alert" className="p-3 text-sm">{error}</p>}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
