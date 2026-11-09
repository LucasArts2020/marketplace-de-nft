import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useSession } from './session'

export function PrivatePayment({ children, returnTo }: { children: ReactNode; returnTo: string }) {
  const { validating, session, error } = useSession()
  if (validating) return <p role="status">Validando sessão…</p>
  if (error) return <p role="alert">Não foi possível validar a sessão.</p>
  return session ? children : (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Entre para continuar</h2>
      <Link to="/login" search={{ returnTo }} className="text-primary underline">Entrar e continuar</Link>
    </section>
  )
}
