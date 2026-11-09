import { delay, http, HttpResponse, type HttpResponseResolver } from 'msw'
import { cartPath, defaultNetwork, type Cart, type CartChange, type Quote } from '../contracts/cart'
import { parseCollector, type Order } from '../contracts/checkout'
import { walletProviders, walletSlots, type Profile, type WalletSettings } from '../contracts/account'
import { priceInEth, priceInWei } from '../contracts/eth'
import { catalogState } from './catalog-state'
import { newCart, queueDelivery, transact, type CommerceState, type StoredAccount, type StoredCart, type StoredOrder } from './commerce-store'
import { marketItems, updateMarket } from './market'

const networks = [defaultNetwork, 'polygon']
const networkFees: Record<string, string> = { ethereum: '0.016', polygon: '0.016' }
const paymentScenarios = ['confirm', 'reject', 'connection-refused', 'timeout-before-commit', 'timeout-after-commit']
let paymentScenario = 'confirm'

function walletsFor(state: CommerceState, userId: string): WalletSettings[] {
  if (state.wallets[userId]) return state.wallets[userId]
  if (!demoAccounts.some((account) => account.id === userId)) return []
  const address = userId === 'collector-a' ? '1' : '2'
  return [{ id: 'primary', provider: 'MetaMask', address: '0x' + address.repeat(40), networks }]
}

const demoAccounts: StoredAccount[] = [
  { id: 'collector-a', username: 'ana', email: 'ana@kurio.test', salt: 'kurio-demo-a',
    hash: '3457b191a5355121d04ebd99604f554fe822407cfb00cb197eb85bdb561adf87' },
  { id: 'collector-b', username: 'bia', email: 'bia@kurio.test', salt: 'kurio-demo-b',
    hash: '79f8f4c96286828dea6b7efc04b48e52446730d954b9ddda289e23bc6fe69628' },
].map((account) => ({
  ...account, displayName: account.username === 'ana' ? 'Ana' : 'Bia',
  ensName: '', walletNickname: '', avatar: null,
}))

function accountList(state: CommerceState) {
  return [...demoAccounts.filter((entry) => !state.accounts[entry.id]), ...Object.values(state.accounts)]
}

function publicProfile(account: StoredAccount): Profile {
  const { displayName, username, email, ensName, walletNickname, avatar } = account
  return { displayName, username, email, ensName, walletNickname, avatar }
}

function value(input: Record<string, unknown>, key: string) {
  const text = input[key]
  return typeof text === 'string' ? text.trim() : ''
}

function validEmail(email: string) {
  return email.length <= 250 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validUsername(username: string) {
  return /^[a-z\d_.-]{3,32}$/i.test(username)
}

function validAvatar(avatar: unknown): avatar is string | null {
  return avatar === null || (typeof avatar === 'string' && avatar.length <= 350_000 &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar))
}

function parseWallet(body: Record<string, unknown>, id: string): WalletSettings | undefined {
  const provider = value(body, 'provider')
  const address = value(body, 'address')
  const network = value(body, 'network')
  const displayName = value(body, 'displayName')
  const nickname = value(body, 'nickname')
  const profileName = value(body, 'profileName')
  const email = value(body, 'email')
  const ensName = value(body, 'ensName')
  const referralCode = value(body, 'referralCode')
  const alternateWalletReference = value(body, 'alternateWalletReference')
  if (!walletSlots.some((slot) => slot === id) || !walletProviders.some((entry) => entry === provider) ||
      !/^0x[a-f\d]{40}$/i.test(address) || !networks.includes(network) || !displayName ||
      (email && !validEmail(email)) ||
      [displayName, nickname, profileName, ensName, referralCode, alternateWalletReference].some((field) => field.length > 120)) {
    return undefined
  }
  return { id, provider, address, networks: [network], displayName, nickname, profileName, email, ensName, referralCode, alternateWalletReference }
}

function strongPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 8 && password.length <= 256
}

async function passwordHash(salt: string, password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + password))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function problem(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message, requestId: crypto.randomUUID() }, { status })
}

async function fields(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null)
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {}
}

function currentSession(state: CommerceState, request: Request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token || !Object.hasOwn(state.sessions, token)) return undefined
  const session = state.sessions[token]
  if (!session || session.expiresAt <= Date.now()) return undefined
  const account = state.accounts[session.userId] ?? demoAccounts.find((entry) => entry.id === session.userId)
  if (!account) return undefined
  return { token, account, user: { id: account.id, username: account.username }, expiresAt: new Date(session.expiresAt).toISOString() }
}

function withAccount(request: Request, action: (state: CommerceState, session: NonNullable<ReturnType<typeof currentSession>>) => Response) {
  return transact((state) => {
    const session = currentSession(state, request)
    return session ? action(state, session) : problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
  })
}

async function saveWallet(request: Request, slot?: string) {
  const body = await fields(request)
  const wallet = parseWallet(body, slot ?? value(body, 'slot'))
  if (!wallet) return problem(422, 'INVALID_WALLET', 'Informe um endereço 0x válido, nome, tipo e rede.')
  return withAccount(request, (state, session) => {
    const wallets = walletsFor(state, session.user.id)
    const existing = wallets.some((entry) => entry.id === wallet.id)
    if (slot && !existing) return problem(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
    if (!slot && existing) return problem(409, 'WALLET_EXISTS', 'Esta carteira já está cadastrada.')
    state.wallets[session.user.id] = [...wallets.filter((entry) => entry.id !== wallet.id), wallet]
      .sort((left, right) => left.id.localeCompare(right.id))
    for (const [id, connection] of Object.entries(state.connections)) {
      if (state.sessions[connection.token]?.userId === session.user.id && connection.wallet.id === wallet.id) {
        delete state.connections[id]
      }
    }
    return HttpResponse.json(wallet, { status: slot ? 200 : 201 })
  })
}

let failFavorite = false
function updateFavorite(request: Request, nftId: string, favorite: boolean) {
  return withAccount(request, (state, session) => {
    if (failFavorite) {
      failFavorite = false
      return problem(503, 'FAVORITE_UNAVAILABLE', 'Não foi possível atualizar os favoritos.')
    }
    if (!catalogState.items.some((item) => item.id === nftId)) {
      return problem(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
    }
    const ids = new Set(state.favorites[session.user.id])
    if (favorite) ids.add(nftId)
    else ids.delete(nftId)
    state.favorites[session.user.id] = [...ids]
    return new HttpResponse(null, { status: 204 })
  })
}

function guestKey(request: Request) {
  return 'guest:' + (request.headers.get('X-Guest-Cart') ?? '')
}

function issueSession(state: CommerceState, request: Request, account: StoredAccount) {
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + 60 * 60 * 1000
  const user = { id: account.id, username: account.username }
  const cart = state.carts[user.id] ??= newCart()
  const key = guestKey(request)
  const guest = state.carts[key]
  const alerts: string[] = []
  if (guest) {
    for (const [id, line] of Object.entries(guest.lines)) {
      const quantity = line.quantity + (cart.lines[id]?.quantity ?? 0)
      cart.lines[id] = { ...line, quantity }
      if (quantity > (editionFor(state, line.nftId, line.editionId)?.edition.available ?? 0)) {
        alerts.push('Alguns itens excedem o estoque. Revise as quantidades.')
      }
    }
    cart.couponCode ??= guest.couponCode
    cart.version++
    delete state.carts[key]
  }
  state.sessions[token] = { userId: user.id, expiresAt }
  return { token, user, expiresAt: new Date(expiresAt).toISOString(), alerts: [...new Set(alerts)] }
}

function resolveCart(state: CommerceState, request: Request) {
  if (request.headers.has('Authorization')) {
    const session = currentSession(state, request)
    return session ? state.carts[session.user.id] : undefined
  }
  return state.carts[guestKey(request)]
}

function editionFor(state: CommerceState, nftId: string, editionId: string) {
  const nft = marketItems(state).find((item) => item.id === nftId)
  const edition = nft?.editions.find((entry) => entry.id === editionId)
  return nft && edition ? { nft, edition } : undefined
}

export function availableStock(state: CommerceState, nftId: string, editionId: string, base: number) {
  let available = base
  for (const { order, quote } of Object.values(state.orders)) {
    if (order.status === 'rejected') continue
    const line = quote.lines.find((entry) => entry.nftId === nftId && entry.editionId === editionId)
    available -= line?.quantity ?? 0
  }
  return Math.max(0, available)
}

function notifyOrder(state: CommerceState, stored: StoredOrder) {
  const { order, owner } = stored
  queueDelivery(state, {
    owner,
    event: {
      eventId: `order:${order.id}:${order.version}`, type: 'order.updated',
      resourceId: order.id, version: order.version, occurredAt: new Date().toISOString(),
      payload: { status: order.status, reason: order.reason },
    },
  })
}

export function settle(state: CommerceState) {
  const now = Date.now()
  for (const stored of Object.values(state.orders)) {
    if (stored.order.status !== 'pending' || stored.dueAt > now) continue
    stored.order.version++
    if (stored.reject) {
      stored.order.status = 'rejected'
      stored.order.reason = 'A carteira recusou o pagamento simulado.'
      state.carts[stored.owner].version++
      notifyOrder(state, stored)
      for (const nftId of new Set(stored.quote.lines.map((line) => line.nftId))) updateMarket(state, nftId)
      continue
    }
    stored.order.status = 'confirmed'
    stored.order.receipt = {
      confirmedAt: new Date(now).toISOString(), transactionId: 'SIM-' + stored.order.id,
      wallet: stored.wallet, quote: stored.quote,
    }
    const cart = state.carts[stored.owner]
    for (const line of stored.quote.lines) {
      const current = cart.lines[line.lineId]
      if (!current) continue
      current.quantity -= line.quantity
      if (current.quantity <= 0) delete cart.lines[line.lineId]
    }
    cart.version++
    notifyOrder(state, stored)
  }
}

let settlementTimer: ReturnType<typeof setTimeout> | undefined

export async function resumePendingOrders() {
  const nextDue = await transact((state) => {
    settle(state)
    return Object.values(state.orders).reduce((next, stored) =>
      stored.order.status === 'pending' ? Math.min(next, stored.dueAt) : next, Infinity)
  })
  clearTimeout(settlementTimer)
  if (Number.isFinite(nextDue)) {
    settlementTimer = setTimeout(() => void resumePendingOrders().catch(console.error), Math.max(0, nextDue - Date.now()))
  }
}

function view(cart: StoredCart, state: CommerceState): Cart {
  const pending = Object.values(state.orders).find(({ order, quote }) =>
    order.status === 'pending' && quote.cartId === cart.id)
  return {
    id: cart.id, version: cart.version, couponCode: cart.couponCode, pendingOrderId: pending?.order.id,
    lines: Object.entries(cart.lines).map(([lineId, line]) => {
      const item = editionFor(state, line.nftId, line.editionId)
      const reservedQuantity = pending?.quote.lines.find((entry) => entry.lineId === lineId)?.quantity ?? 0
      return {
        ...line, lineId, reservedQuantity,
        name: item?.nft.name ?? line.nftId,
        image: item?.nft.image,
        editionLabel: item?.edition.label ?? line.editionId,
        priceEth: item?.edition.priceEth ?? '0',
        available: availableStock(state, line.nftId, line.editionId, item?.edition.available ?? 0) + reservedQuantity,
        editionVersion: item?.edition.version ?? 0,
      }
    }),
  }
}

function invalidCoupon(code: string) {
  if (code === 'EXPIRADO') return problem(422, 'COUPON_EXPIRED', 'O cupom expirou.')
  if (code !== 'KURIO10') return problem(422, 'INVALID_COUPON', 'Cupom inválido.')
}

function applyChange(cart: StoredCart, change: CartChange, state: CommerceState) {
  if (change.kind === 'coupon') {
    const code = change.code.trim().toUpperCase()
    const error = invalidCoupon(code)
    if (error) return error
    cart.couponCode = code
  } else if (change.kind === 'clear-coupon') {
    delete cart.couponCode
  } else if (change.kind === 'remove') {
    if (!Object.hasOwn(cart.lines, change.lineId)) return problem(404, 'LINE_NOT_FOUND', 'Item não encontrado.')
    if (view(cart, state).lines.find((line) => line.lineId === change.lineId)?.reservedQuantity) {
      return problem(409, 'RESERVED_ITEM', 'Este item está reservado por um pedido pendente.')
    }
    delete cart.lines[change.lineId]
  } else {
    const id = change.kind === 'add' ? `${change.nftId}:${change.editionId}` : change.lineId
    const existing = Object.hasOwn(cart.lines, id) ? cart.lines[id] : undefined
    const line = change.kind === 'add' ? change : existing
    if (!line) return problem(404, 'LINE_NOT_FOUND', 'Item não encontrado.')
    const item = editionFor(state, line.nftId, line.editionId)
    if (!item) return problem(404, 'EDITION_NOT_FOUND', 'Edição não encontrada.')
    const quantity = change.quantity + (change.kind === 'add' ? existing?.quantity ?? 0 : 0)
    const reserved = view(cart, state).lines.find((entry) => entry.lineId === id)?.reservedQuantity ?? 0
    if (quantity < reserved) return problem(409, 'RESERVED_ITEM', 'Esta quantidade está reservada.')
    if (quantity - reserved > availableStock(state, line.nftId, line.editionId, item.edition.available)) {
      return problem(409, 'OUT_OF_STOCK', 'A quantidade excede o estoque disponível.')
    }
    cart.lines[id] = { nftId: line.nftId, editionId: line.editionId, quantity }
  }
  cart.version++
  return HttpResponse.json(view(cart, state))
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function cartMutation(parse: (body: Record<string, unknown>, lineId: string) => CartChange | undefined): HttpResponseResolver {
  return async ({ request, params }) => {
    const body = request.method === 'DELETE' ? {} : await fields(request)
    const version = request.method === 'DELETE' ? Number(request.headers.get('If-Match')) : body.cartVersion
    const change = parse(body, String(params.lineId ?? ''))
    if (!change || !positiveInteger(version)) return problem(422, 'INVALID_CHANGE', 'Dados do carrinho inválidos.')
    return transact((state) => {
      settle(state)
      const cart = resolveCart(state, request)
      if (!cart) return problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
      if (version !== cart.version) return problem(409, 'STALE_CART', 'O carrinho mudou. Revise os itens.')
      return applyChange(cart, change, state)
    })
  }
}

export const commerceHandlers = [
  http.post('/api/v1/guest-carts', () => transact((state) => {
    const token = crypto.randomUUID()
    const cart = newCart()
    state.carts['guest:' + token] = cart
    return HttpResponse.json({ token, cart: view(cart, state) }, { status: 201 })
  })),
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await fields(request)
    const email = value(body, 'email').toLowerCase()
    const password = body.password
    const account = await transact((state) => accountList(state).find((entry) => entry.email === email))
    if (!account || !strongPassword(password) || await passwordHash(account.salt, password) !== account.hash) {
      return problem(401, 'INVALID_LOGIN', 'E-mail ou senha inválidos.')
    }
    return transact((state) => {
      const latest = accountList(state).find((entry) => entry.id === account.id)
      if (!latest || latest.hash !== account.hash || latest.email !== email) {
        return problem(401, 'INVALID_LOGIN', 'E-mail ou senha inválidos.')
      }
      return HttpResponse.json(issueSession(state, request, latest))
    })
  }),
  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = await fields(request)
    const email = value(body, 'email').toLowerCase()
    const username = value(body, 'username')
    const password = body.password
    if (!validEmail(email) || !validUsername(username) || !strongPassword(password)) {
      return problem(422, 'INVALID_ACCOUNT', 'Informe um e-mail válido, um nome de usuário de 3 a 32 caracteres e uma senha de 8 a 256 caracteres.')
    }
    const salt = crypto.randomUUID()
    const hash = await passwordHash(salt, password)
    return transact((state) => {
      if (accountList(state).some((entry) => entry.email === email || entry.username.toLowerCase() === username.toLowerCase())) {
        return problem(409, 'DUPLICATE_ACCOUNT', 'E-mail ou nome de usuário já cadastrado.')
      }
      const account = { id: crypto.randomUUID(), email, username, displayName: username, ensName: '', walletNickname: '', avatar: null, salt, hash }
      state.accounts[account.id] = account
      return HttpResponse.json(issueSession(state, request, account), { status: 201 })
    })
  }),
  http.get('/api/v1/session', ({ request }) => transact((state) => {
    const session = currentSession(state, request)
    return session
      ? HttpResponse.json({ user: session.user, expiresAt: session.expiresAt })
      : problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
  })),
  http.get('/api/v1/profile', ({ request }) =>
    withAccount(request, (_state, session) => HttpResponse.json(publicProfile(session.account)))),
  http.patch('/api/v1/profile', async ({ request }) => {
    const body = await fields(request)
    return withAccount(request, (state, session) => {
      const previous = publicProfile(session.account)
      const input = { ...previous, ...body }
      const profile = {
        displayName: value(input, 'displayName'), username: value(input, 'username'),
        email: value(input, 'email').toLowerCase(), ensName: value(input, 'ensName'),
        walletNickname: value(input, 'walletNickname'), avatar: input.avatar,
      }
      if (!validEmail(profile.email) || !validUsername(profile.username) ||
          !profile.displayName || [profile.displayName, profile.ensName, profile.walletNickname].some((field) => field.length > 120) ||
          !validAvatar(profile.avatar)) {
        return problem(422, 'INVALID_PROFILE', 'Revise os dados do perfil e use um avatar PNG, JPEG ou WebP de até 256 KB.')
      }
      if (accountList(state).some((entry) => entry.id !== session.user.id &&
          (entry.email === profile.email || entry.username.toLowerCase() === profile.username.toLowerCase()))) {
        return problem(409, 'DUPLICATE_ACCOUNT', 'E-mail ou nome de usuário já cadastrado.')
      }
      state.accounts[session.user.id] = { ...session.account, ...profile, avatar: profile.avatar }
      return HttpResponse.json(publicProfile(state.accounts[session.user.id]))
    })
  }),
  http.put('/api/v1/profile/password', async ({ request }) => {
    const { currentPassword, newPassword } = await fields(request)
    if (!strongPassword(currentPassword) || !strongPassword(newPassword) || currentPassword === newPassword) {
      return problem(422, 'INVALID_PASSWORD', 'Informe a senha atual e uma nova senha diferente de 8 a 256 caracteres.')
    }
    const previous = await transact((state) => currentSession(state, request))
    if (!previous) return problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
    if (await passwordHash(previous.account.salt, currentPassword) !== previous.account.hash) {
      return problem(422, 'INVALID_PASSWORD', 'A senha atual está incorreta.')
    }
    const salt = crypto.randomUUID()
    const hash = await passwordHash(salt, newPassword)
    return withAccount(request, (state, session) => {
      if (session.account.hash !== previous.account.hash) return problem(409, 'PASSWORD_CHANGED', 'A senha já foi alterada.')
      state.accounts[session.user.id] = { ...session.account, salt, hash }
      for (const [token, entry] of Object.entries(state.sessions)) {
        if (entry.userId === session.user.id && token !== session.token) delete state.sessions[token]
      }
      return new HttpResponse(null, { status: 204 })
    })
  }),
  http.get('/api/v1/favorites', ({ request }) => withAccount(request, (state, session) =>
    HttpResponse.json(state.favorites[session.user.id] ?? []))),
  http.put('/api/v1/favorites/:nftId', ({ request, params }) => updateFavorite(request, String(params.nftId), true)),
  http.delete('/api/v1/favorites/:nftId', ({ request, params }) => updateFavorite(request, String(params.nftId), false)),
  http.post('/__demo/favorites/fail-next', () => {
    failFavorite = true
    return new HttpResponse(null, { status: 204 })
  }),
  http.post('/__demo/session/expire', ({ request }) => withAccount(request, (state, session) => {
    state.sessions[session.token].expiresAt = 0
    return new HttpResponse(null, { status: 204 })
  })),
  http.post('/api/v1/auth/logout', ({ request }) => transact((state) => {
    const session = currentSession(state, request)
    if (session) {
      delete state.sessions[session.token]
      for (const [id, connection] of Object.entries(state.connections)) {
        if (connection.token === session.token) delete state.connections[id]
      }
    }
    return new HttpResponse(null, { status: 204 })
  })),
  http.get(cartPath, ({ request }) => transact((state) => {
    settle(state)
    const cart = resolveCart(state, request)
    return cart ? HttpResponse.json(view(cart, state)) : problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
  })),
  http.post(cartPath + '/items', cartMutation(({ nftId, editionId, quantity }) =>
    typeof nftId === 'string' && typeof editionId === 'string' && positiveInteger(quantity)
      ? { kind: 'add', nftId, editionId, quantity } : undefined)),
  http.patch(cartPath + '/items/:lineId', cartMutation(({ quantity }, lineId) =>
    positiveInteger(quantity) ? { kind: 'quantity', lineId, quantity } : undefined)),
  http.delete(cartPath + '/items/:lineId', cartMutation((_body, lineId) => ({ kind: 'remove', lineId }))),
  http.put(cartPath + '/coupon', cartMutation(({ code }) => typeof code === 'string' ? { kind: 'coupon', code } : undefined)),
  http.delete(cartPath + '/coupon', cartMutation(() => ({ kind: 'clear-coupon' }))),
  http.post('/api/v1/quotes', async ({ request }) => {
    const { cartVersion, networkId = defaultNetwork } = await fields(request)
    if (!positiveInteger(cartVersion) || typeof networkId !== 'string' || !networks.includes(networkId)) {
      return problem(422, 'INVALID_QUOTE', 'Dados da cotação inválidos.')
    }
    return transact((state) => {
      settle(state)
      const cart = resolveCart(state, request)
      if (!cart) return problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
      const { lines, version, couponCode } = view(cart, state)
      if (version !== cartVersion) return problem(409, 'STALE_CART', 'O carrinho mudou. Revise os itens.')
      if (lines.some((line) => line.quantity > line.available)) {
        return problem(409, 'OUT_OF_STOCK', 'Revise os itens com estoque insuficiente.')
      }
      if (lines.some((line) => line.reservedQuantity > 0)) {
        return problem(409, 'PENDING_ORDER', 'Aguarde o pedido pendente antes de gerar uma nova cotação.')
      }
      const couponError = couponCode ? invalidCoupon(couponCode) : undefined
      if (couponError) return couponError
      const subtotal = lines.reduce((sum, line) => sum + priceInWei(line.priceEth) * BigInt(line.quantity), 0n)
      const discount = couponCode ? subtotal / 10n : 0n
      const fee = lines.length ? priceInWei(networkFees[networkId]) : 0n
      const quote: Quote = {
        id: crypto.randomUUID(), cartId: cart.id, cartVersion: version, catalogVersion: state.catalogVersion, networkId,
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(), lines, couponCode,
        subtotalEth: priceInEth(subtotal), discountEth: priceInEth(discount),
        networkFeeEth: priceInEth(fee), totalEth: priceInEth(subtotal - discount + fee),
      }
      if (request.headers.has('Authorization') && lines.length) {
        for (const [id, previous] of Object.entries(state.quotes)) {
          if (Date.parse(previous.expiresAt) <= Date.now()) delete state.quotes[id]
        }
        state.quotes[quote.id] = quote
      }
      return HttpResponse.json(quote)
    })
  }),
  http.get('/api/v1/wallets', ({ request }) => transact((state) => {
    const session = currentSession(state, request)
    return session ? HttpResponse.json(walletsFor(state, session.user.id)) : problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
  })),
  http.post('/api/v1/wallets', ({ request }) => saveWallet(request)),
  http.patch('/api/v1/wallets/:id', ({ request, params }) => saveWallet(request, String(params.id))),
  http.post('/api/v1/wallet-connections', async ({ request }) => {
    const { walletId, networkId } = await fields(request)
    return transact((state) => {
      const session = currentSession(state, request)
      if (!session) return problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
      const wallet = walletsFor(state, session.user.id).find((entry) => entry.id === walletId)
      if (!wallet || typeof networkId !== 'string' || !wallet.networks.includes(networkId)) {
        return problem(422, 'INVALID_WALLET', 'Selecione uma carteira e rede válidas.')
      }
      if (paymentScenario === 'connection-refused') {
        return problem(422, 'CONNECTION_REFUSED', 'A carteira recusou a conexão.')
      }
      const connection = { id: crypto.randomUUID(), wallet, networkId }
      state.connections[connection.id] = { ...connection, token: session.token }
      return HttpResponse.json(connection, { status: 201 })
    })
  }),
  http.delete('/api/v1/wallet-connections/:id', ({ request, params }) => transact((state) => {
    const session = currentSession(state, request)
    if (!session) return problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
    const id = String(params.id)
    if (state.connections[id]?.token === session.token) delete state.connections[id]
    return new HttpResponse(null, { status: 204 })
  })),
  http.post('/api/v1/orders', async ({ request }) => {
    const key = request.headers.get('Idempotency-Key')
    const { quoteId, connectionId, collector: input } = await fields(request)
    const collector = parseCollector(input)
    if (!key || key.length > 100 || typeof quoteId !== 'string' || typeof connectionId !== 'string' || !collector) {
      return problem(422, 'INVALID_ORDER', 'Revise os dados do pedido.')
    }
    const fingerprint = await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(JSON.stringify({ quoteId, connectionId, collector })))
      .then((buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join(''))
    const scenario = paymentScenario
    if (scenario === 'timeout-before-commit') {
      paymentScenario = 'confirm'
      await delay(11_000)
      return HttpResponse.error()
    }
    const result = await transact((state) => {
      const session = currentSession(state, request)
      if (!session) return problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
      settle(state)
      const owner = session.user.id
      const previous = Object.values(state.orders).find((entry) => entry.owner === owner && entry.key === key)
      if (previous) return previous.fingerprint === fingerprint
        ? HttpResponse.json(previous.order)
        : problem(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada em outro pedido.')
      const cart = state.carts[owner]
      const quote = Object.hasOwn(state.quotes, quoteId) ? state.quotes[quoteId] : undefined
      const connection = Object.hasOwn(state.connections, connectionId) ? state.connections[connectionId] : undefined
      if (!connection || connection.token !== session.token) {
        return problem(422, 'INVALID_CONNECTION', 'Conecte a carteira novamente.')
      }
      if (!quote || quote.cartId !== cart.id || quote.cartVersion !== cart.version ||
          quote.networkId !== connection.networkId || !quote.lines.length || Date.parse(quote.expiresAt) <= Date.now() ||
          quote.networkFeeEth !== networkFees[connection.networkId] ||
          quote.couponCode !== cart.couponCode || (quote.couponCode && invalidCoupon(quote.couponCode)) ||
          JSON.stringify(view(cart, state).lines) !== JSON.stringify(quote.lines)) {
        return problem(409, 'STALE_QUOTE', 'A cotação mudou. Revise os valores antes de confirmar.')
      }
      const order: Order = { id: crypto.randomUUID(), version: 1, status: 'pending' }
      state.orders[order.id] = {
        order, owner, key, fingerprint, quote, wallet: connection.wallet,
        dueAt: Date.now() + 2500, reject: scenario === 'reject',
      }
      cart.version++
      notifyOrder(state, state.orders[order.id])
      for (const nftId of new Set(quote.lines.map((line) => line.nftId))) updateMarket(state, nftId)
      return HttpResponse.json(order, { status: 202 })
    })
    if (result.status === 202) void resumePendingOrders().catch(console.error)
    if (result.status === 202 && scenario === 'timeout-after-commit') await delay(11_000)
    return result
  }),
  http.get('/api/v1/orders/:id', ({ request, params }) => transact((state) => {
    const session = currentSession(state, request)
    if (!session) return problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
    const stored = state.orders[String(params.id)]
    if (!stored || stored.owner !== session.user.id) return problem(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    settle(state)
    return HttpResponse.json(stored.order)
  })),
  http.get('/api/v1/order-attempts/:key', ({ request, params }) => transact((state) => {
    const session = currentSession(state, request)
    if (!session) return problem(401, 'INVALID_SESSION', 'Sua sessão expirou.')
    const stored = Object.values(state.orders).find((entry) => entry.owner === session.user.id && entry.key === params.key)
    if (!stored) return problem(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    settle(state)
    return HttpResponse.json(stored.order)
  })),
  http.post('/__demo/payment', async ({ request }) => {
    const { scenario } = await fields(request)
    if (typeof scenario !== 'string' || !paymentScenarios.includes(scenario)) {
      return problem(422, 'INVALID_SCENARIO', 'Cenário inválido.')
    }
    paymentScenario = scenario
    return new HttpResponse(null, { status: 204 })
  }),
]
