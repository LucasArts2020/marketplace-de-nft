import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'
import { errorMessage } from '../api/http'
import { Button } from '../components/ui/button'
import { useSession } from './session'
import { useCart } from './use-cart'
import { HeaderSearch } from '../catalog/header-search'

export function AccountNav() {
  const { session, alerts, signOut, validating, error } = useSession()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const { cart } = useCart()
  const pathname = useLocation({ select: (location) => location.pathname })
  const atHome = useLocation({ select: (location) => location.pathname === '/' &&
    location.hash !== 'catalog-title' && location.hash !== 'diario-da-cunhagem' })
  const atNft = useLocation({ select: (location) => location.pathname.startsWith('/nfts/') })
  const onAuthPage = useLocation({ select: (location) => location.pathname === '/login' || location.pathname === '/register' })
  const inAccount = useLocation({ select: (location) => ['/profile', '/wallets', '/favorites'].includes(location.pathname) })
  const cartCount = !cart.isError ? cart.data?.lines.reduce((count, line) => count + line.quantity, 0) ?? 0 : 0
  return (
    <header className="market-header space-y-2 border-b border-edge pb-3">
      <a href="#conteudo" className="sr-only focus:not-sr-only">Pular para o conteúdo</a>
      <div className="market-header-row">
        <Link to="/" className="market-wordmark" aria-label="Kurio">KURIO</Link>
        <nav aria-label="Navegação principal" className="market-nav">
          <div className="market-nav-menu">
            <Link to="/" activeOptions={{ exact: true, includeHash: true }} data-current={atHome || undefined}
              aria-current={atHome ? 'page' : undefined} className="market-nav-link market-nav-home">
              <svg className="size-5 md:hidden" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10 12 3l9 7v10h-6v-6H9v6H3z" /></svg>
              <span>Início</span>
            </Link>
            <Link to="/" hash="catalog-title" activeOptions={{ exact: true, includeHash: true }}
              aria-current={atNft ? 'location' : undefined} className="market-nav-link hidden! md:flex!">Mercado</Link>
            <Link to="/favorites" className="market-nav-link md:hidden!" aria-label="Favoritos"><span className="text-xl" aria-hidden="true">♥</span><span>Favoritos</span></Link>
            <Link to="/creators" className="market-nav-link market-nav-creators">
              <span className="market-nav-center md:hidden">
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="9" cy="7" r="3" /><path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M17 4a3 3 0 0 1 0 6m4 10v-2a4 4 0 0 0-3-4" />
                </svg>
              </span><span>Criadores</span>
            </Link>
            <Link to="/" hash="diario-da-cunhagem" activeOptions={{ exact: true, includeHash: true }} className="market-nav-link hidden! md:flex!">Aprenda</Link>
          </div>
          <div className="market-nav-actions">
          <HeaderSearch className="hidden md:block" />
          <Link to="/cart" aria-description={`${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`} className="market-nav-link">
            <span className="relative">
              <img src="/art/cart.svg" alt="" />
              <span aria-hidden="true" className="market-cart-count">{cartCount}</span>
            </span>
            <span className="md:sr-only">Carrinho</span>
          </Link>
          {session ? (
            <Link to="/profile" className="market-nav-link"><img src="/art/user.svg" alt="" />Perfil</Link>
          ) : !validating && !onAuthPage && (
            <>
              <button type="button" aria-haspopup="dialog" className="market-nav-link market-nav-login hidden! md:flex!" onClick={() => setAuthOpen(true)}>
                <img src="/art/enter.svg" alt="" />Entrar
              </button>
              <Link to="/login" search={{ returnTo: pathname }} className="market-nav-link md:hidden!"><img src="/art/user.svg" alt="" />Entrar</Link>
            </>
          )}
          </div>
        </nav>
        {session ? (
          <div className="market-account-links flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
            <span className="text-secondary">Olá, {session.user.username}</span>
            {pathname === '/cart' && <Link to="/profile" className="text-primary underline md:hidden">Perfil</Link>}
            {!inAccount && <>
            <Link to="/wallets" className="text-primary underline">Carteiras</Link>
            <Link to="/favorites" className="text-primary underline">Favoritos</Link>
            <Button variant="outline" disabled={busy} onClick={async () => {
              setBusy(true)
              setMessage('')
              try { await signOut() } catch (error) {
                setMessage(errorMessage(error, 'Não foi possível sair.'))
              } finally { setBusy(false) }
            }}>Sair</Button>
            </>}
          </div>
        ) : null}
      </div>
      {pathname === '/cart' && !session && !validating &&
        <Link to="/login" search={{ returnTo: '/cart' }} className="mobile-cart-account text-xs text-accent underline md:hidden">Entrar</Link>}
      {alerts.map((alert) => <p key={alert} role="status">{alert}</p>)}
      {message && <p role="alert">{message}</p>}
      {error && <p role="alert">{errorMessage(error, 'Não foi possível validar a sessão.')}</p>}
      {authOpen && <AccountDialog onClose={() => setAuthOpen(false)} />}
    </header>
  )
}

function SocialAccess({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-3 text-center text-xs ${className}`}>
      <p className="flex items-center gap-3 before:h-px before:flex-1 before:bg-edge after:h-px after:flex-1 after:bg-edge">Ou continue com</p>
      <Button type="button" variant="outline" disabled className="w-full border-edge text-xs">Continuar com Google</Button>
      <Button type="button" variant="outline" disabled className="w-full border-edge text-xs">Continuar com Facebook</Button>
      <p className="text-secondary">Acesso por redes sociais indisponível na demonstração.</p>
    </div>
  )
}

export function AccountDialog({ onClose, onAuthenticated }: {
  onClose: () => void
  onAuthenticated?: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [register, setRegister] = useState(false)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  function close() {
    dialog.current?.close()
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-label={register ? 'Criar conta' : 'Entrar na conta'}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[500px] overflow-y-auto overscroll-contain border-0 border-b-[6px] border-primary bg-card p-0 text-foreground backdrop:bg-black/75">
      <button type="button" onClick={close} aria-label="Fechar formulário"
        className="absolute top-1 right-1 grid size-10 place-items-center text-xl text-accent">×</button>
      <div className="px-[clamp(1rem,7vw,4.5rem)] pt-12 pb-14">
        <div role="group" aria-label="Acesso à conta" className="mb-7 flex flex-wrap items-center justify-center gap-2 text-base font-bold">
          <button type="button" aria-label="Modo Entrar" aria-pressed={!register} onClick={() => setRegister(false)}
            className="min-h-9 aria-pressed:text-accent">Entrar</button>
          <span aria-hidden="true" className="text-secondary">|</span>
          <button type="button" aria-label="Modo Criar conta" aria-pressed={register} onClick={() => setRegister(true)}
            className="min-h-9 aria-pressed:text-accent">Criar conta</button>
        </div>
        <LoginPage key={String(register)} returnTo="/" register={register} onAuthenticated={() => {
          close()
          onAuthenticated?.()
        }} />
        <SocialAccess className="mt-6" />
      </div>
    </dialog>
  )
}

export function LoginPage({ returnTo, register = false, onAuthenticated }: {
  returnTo: string
  register?: boolean
  onAuthenticated?: () => void
}) {
  const { session, signIn } = useSession()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [mismatched, setMismatched] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const passwordId = useId()
  const errorId = useId()
  const credentialError = Boolean(message) && !mismatched
  const modal = Boolean(onAuthenticated)

  if (session && !busy && !modal) return <Link to={returnTo} className="text-primary underline">Continuar</Link>
  return (
    <section className={modal ? 'space-y-5' : 'mobile-auth mx-auto max-w-[500px] space-y-6 rounded-2xl border border-edge bg-card p-5 sm:p-10'}>
      {!modal && <>
      <div className="mobile-auth-brand flex items-center justify-between gap-4">
        <p className="text-xs font-bold tracking-[.18em] text-secondary">KURIO<span className="hidden md:inline"> · CONTA</span></p>
        <Link to={returnTo} aria-label="Fechar formulário" className="grid size-11 place-items-center rounded-md border border-edge text-xl">×</Link>
      </div>
      <h1 className="text-base font-semibold md:text-3xl">{register ? <>
        <span className="md:hidden">Criar perfil de colecionador</span><span className="hidden md:inline">Criar conta</span>
      </> : 'Entrar'}</h1>
      </>}
      <p className={modal ? 'text-center text-xs' : 'hidden text-sm text-secondary md:block'}>{register
        ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
        : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}</p>
      <form className="space-y-4" aria-describedby={message ? errorId : undefined} onChange={() => {
        if (message) { setMessage(''); setMismatched(false) }
      }} onSubmit={async (event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        setMessage('')
        if (register && form.get('password') !== form.get('confirmation')) {
          setMismatched(true)
          setMessage('As senhas devem ser iguais.')
          event.currentTarget.querySelector<HTMLInputElement>('[name="confirmation"]')?.focus()
          return
        }
        setMismatched(false)
        setBusy(true)
        try {
          await signIn(String(form.get('email')), String(form.get('password')),
            register ? String(form.get('username')) : undefined)
          if (onAuthenticated) onAuthenticated()
          else await navigate({ to: returnTo })
        } catch (error) {
          setMessage(errorMessage(error, 'Não foi possível entrar.'))
        } finally {
          setBusy(false)
        }
      }}>
        {register && (
          <label className="grid gap-1"><span className={modal ? 'sr-only' : 'sr-only md:not-sr-only'}>Nome de usuário</span>
            <input name="username" placeholder="Nome de usuário" autoComplete="username" required minLength={3} maxLength={32}
              aria-describedby={credentialError ? errorId : undefined}
              className="min-h-11 rounded-md border border-secondary px-3" />
          </label>
        )}
        <label className="grid gap-1">
          <span className={modal ? 'sr-only' : 'sr-only md:not-sr-only'}>E-mail</span>
          <input name="email" type="email" placeholder="Digite seu e-mail" autoComplete="username" required
            aria-describedby={credentialError ? errorId : undefined} className="min-h-11 rounded-md border border-secondary px-3" />
        </label>
        <div className="space-y-1">
          <label htmlFor={passwordId} className={modal ? 'sr-only' : 'sr-only md:not-sr-only'}>Senha</label>
          <div className="mobile-auth-password flex gap-2">
            <input id={passwordId} name="password" type={passwordVisible ? 'text' : 'password'} placeholder="Senha"
              aria-describedby={credentialError ? errorId : undefined}
              autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined}
              required className="min-h-11 min-w-0 flex-1 rounded-md border border-secondary px-3" />
            <Button type="button" variant="outline" aria-pressed={passwordVisible} aria-controls={passwordId}
              onClick={() => setPasswordVisible((current) => !current)}>
              {passwordVisible ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
        {!modal && !register && <button type="button" disabled title="Recuperação indisponível na demonstração"
          className="ml-auto block text-xs text-secondary md:hidden">Esqueceu a senha?</button>}
        {register && (
          <label className="grid gap-1"><span className={modal ? 'sr-only' : 'sr-only md:not-sr-only'}>Confirmar senha</span>
            <input name="confirmation" type="password" placeholder="Confirmar senha" autoComplete="new-password" required
              aria-invalid={mismatched || undefined} aria-describedby={mismatched ? errorId : undefined}
              className="min-h-11 rounded-md border border-secondary px-3" />
          </label>
        )}
        {message && <p id={errorId} role="alert">{message}</p>}
        <Button className="w-full" disabled={busy}>{register && !modal ? <>
          <span className="md:hidden">Criar perfil</span><span className="hidden md:inline">Criar conta</span>
        </> : register ? 'Criar conta' : 'Entrar'}</Button>
      </form>
      {!modal && <>
        <SocialAccess className="md:hidden" />
        <p className="text-xs md:text-base">
          <span className="md:hidden">{register ? 'Já tem uma conta? ' : 'Novo na Kurio? '}</span>
          <Link to={register ? '/login' : '/register'} search={{ returnTo }} className="text-primary underline">
            {register ? <><span className="md:hidden">Entre</span><span className="hidden md:inline">Já tenho conta</span></> : 'Criar conta'}
          </Link>
        </p>
      </>}
    </section>
  )
}
