import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Link, Outlet, RouterProvider, stripSearchParams, useLocation } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { CatalogPage } from './catalog/catalog-page'
import { HomeFooter } from './catalog/home-editorial'
import { NftPage } from './catalog/nft-page'
import { AccountNav, LoginPage } from './commerce/account'
import { PrivatePayment } from './commerce/private-payment'
import { FavoritesPage } from './commerce/favorites'
import { SessionProvider, useSession } from './commerce/session'
import { AccountLayout } from './commerce/account-layout'
import { parseCatalogSearch } from './contracts/catalog'
import '@fontsource-variable/roboto-mono/wght.css'
import './styles.css'

function Root() {
  const { identity } = useSession()
  const path = useLocation({ select: (location) => location.pathname })
  const screen = path.startsWith('/nfts/') ? 'nft' : path.slice(1) || 'home'
  const fullFooter = ['home', 'checkout', 'nft'].includes(screen)
  return (
    <div className="market-shell" data-screen={screen}>
      <AccountNav />
      <main id="conteudo" tabIndex={-1} className="min-w-0 grow">
        <Outlet key={identity.generation} />
      </main>
      {fullFooter ? <HomeFooter /> : <footer className="market-footer">
        <div className="grid gap-4 bg-card p-5 sm:grid-cols-3 sm:gap-8">
          <div className="space-y-2">
            <span className="font-bold tracking-widest text-foreground">KURIO</span>
            <p>Feito para colecionadores, criadores e cultura.</p>
          </div>
          <div className="space-y-2">
            <h2 className="font-bold text-foreground">Marketplace</h2>
            <ul className="space-y-1">
              <li><Link to="/" className="underline">Explorar mercado</Link></li>
              <li><Link to="/" search={{ tab: 'new' }} className="underline">Novos lançamentos</Link></li>
              <li><Link to="/" search={{ tab: 'trending' }} className="underline">Coleções em alta</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h2 className="font-bold text-foreground">Colecionador</h2>
            <ul className="space-y-1">
              <li><Link to="/profile" className="underline">Minha conta</Link></li>
              <li><Link to="/wallets" className="underline">Minhas carteiras</Link></li>
              <li><Link to="/favorites" className="underline">NFTs salvos</Link></li>
            </ul>
          </div>
        </div>
        <p className="px-5 py-4">Kurio · Marketplace de demonstração</p>
      </footer>}
    </div>
  )
}

const rootRoute = createRootRoute({
  component: Root,
  notFoundComponent: () => <p>Página não encontrada.</p>,
})
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: parseCatalogSearch,
  search: { middlewares: [stripSearchParams(parseCatalogSearch({}))] },
  component: () => {
    const search = indexRoute.useSearch()
    const navigate = indexRoute.useNavigate()
    return <CatalogPage search={search} onNavigate={(next) => void navigate({
      search: next,
      resetScroll: false,
      hashScrollIntoView: false,
    })} />
  },
})
const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$id',
  component: () => <NftPage id={nftRoute.useParams().id} />,
})
const creatorsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/creators', component: lazyRouteComponent(() => import('./catalog/creators-page'), 'CreatorsPage') })
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cart', component: lazyRouteComponent(() => import('./commerce/cart-page'), 'CartPage') })
const ProfilePage = lazyRouteComponent(() => import('./commerce/profile-page'), 'ProfilePage')
const WalletsPage = lazyRouteComponent(() => import('./commerce/wallets-page'), 'WalletsPage')
const CheckoutPage = lazyRouteComponent(() => import('./commerce/checkout-page'), 'CheckoutPage')
const OrderPage = lazyRouteComponent(() => import('./commerce/checkout-page'), 'OrderPage')
function validateReturn(search: Record<string, unknown>) {
  return {
    returnTo: typeof search.returnTo === 'string' &&
      (/^\/orders\/[\da-f-]{36}$/i.test(search.returnTo) || /^\/nfts\/[\w-]+$/.test(search.returnTo) ||
        ['/cart', '/checkout', '/profile', '/wallets', '/favorites', '/creators'].includes(search.returnTo))
      ? search.returnTo : '/',
  }
}
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: validateReturn,
  component: () => <LoginPage returnTo={loginRoute.useSearch().returnTo} />,
})
const registerRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/register', validateSearch: validateReturn,
  component: () => <LoginPage register returnTo={registerRoute.useSearch().returnTo} />,
})
const profileRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/profile',
  component: () => <PrivatePayment returnTo="/profile"><AccountLayout><ProfilePage /></AccountLayout></PrivatePayment>,
})
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/wallets',
  component: () => <PrivatePayment returnTo="/wallets"><AccountLayout><WalletsPage /></AccountLayout></PrivatePayment>,
})
const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/favorites',
  component: () => <PrivatePayment returnTo="/favorites"><AccountLayout><FavoritesPage /></AccountLayout></PrivatePayment>,
})
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/checkout',
  component: () => <PrivatePayment returnTo="/checkout"><CheckoutPage /></PrivatePayment>,
})
const orderRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/orders/$id',
  component: () => {
    const { id } = orderRoute.useParams()
    return <PrivatePayment returnTo={`/orders/${id}`}><OrderPage id={id} /></PrivatePayment>
  },
})

async function start() {
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
  // Engine.IO reads the WebSocket constructor when its module is evaluated.
  const { RealtimeProvider } = await import('./socket/realtime')
  const probeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/demo/socket',
    component: lazyRouteComponent(() => import('./socket/probe'), 'SocketProbe'),
  })
  const routeTree = rootRoute.addChildren([
    indexRoute, nftRoute, creatorsRoute, cartRoute, loginRoute, registerRoute, profileRoute,
    walletsRoute, favoritesRoute, checkoutRoute, orderRoute, probeRoute,
  ])
  const router = createRouter({ routeTree })
  const queryClient = new QueryClient()
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider><RealtimeProvider><RouterProvider router={router} /></RealtimeProvider></SessionProvider>
    </QueryClientProvider>,
  )
}

void start().catch((error: unknown) => {
  console.error(error)
  createRoot(document.getElementById('root')!).render(
    <p role="alert">Não foi possível iniciar o marketplace.</p>,
  )
})
