import { expect, test, type Page } from '@playwright/test'

async function checkout(page: Page) {
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()
  await page.getByRole('link', { name: 'Carrinho', exact: true }).click()
  await page.getByRole('link', { name: /Finalizar compra|Conectar e finalizar/ }).click()
  await page.getByRole('link', { name: 'Entrar e continuar' }).click()
  await page.getByLabel('E-mail').fill('ana@kurio.test')
  await page.getByLabel('Senha').fill('KurioDemo123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
}

async function scenario(page: Page, scenario: string) {
  const status = await page.evaluate(async (scenario) => (await fetch('/__demo/payment', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario }),
  })).status, scenario)
  expect(status).toBe(204)
}

async function review(page: Page) {
  await page.getByRole('combobox', { name: 'Rede', exact: true }).selectOption('polygon')
  await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
  await expect(page.getByText(/Carteira conectada/)).toBeVisible()
  await page.getByLabel('Nome de exibição').fill('Ana')
  await page.getByLabel('Nome do perfil').fill('Ana Colecionadora')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Código de indicação').fill('KURIO')
  await page.getByLabel('Nome ENS').fill('ana.eth')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Revisão do pedido' })).toBeVisible()
}

async function socketCommand(page: Page, command: unknown) {
  const status = await page.evaluate(async (value) => (await fetch('/__demo/socket', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
  })).status, command)
  expect(status).toBe(204)
}

test('confirms a simulated purchase, survives refresh and deducts purchased items', async ({ page }) => {
  await checkout(page)
  await review(page)
  await expect(page.getByText('1.206 ETH')).toBeVisible()
  const submitted = page.waitForRequest((request) => request.method() === 'POST' &&
    new URL(request.url()).pathname === '/api/v1/orders')
  await page.getByRole('button', { name: 'Confirmar compra' }).dblclick()
  const request = await submitted
  await expect(page).toHaveURL(/\/orders\//)
  await expect(page.getByText('Pagamento pendente.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  await expect(page.getByText(/Transação simulada: SIM-/)).toBeVisible()
  const receipt = page.getByRole('dialog', { name: 'Compra confirmada' })
  await expect(receipt.getByText('1.206 ETH', { exact: true })).toHaveCount(2)
  const headers = request.headers()
  const result = await page.evaluate(async ({ body, key, auth }) => {
    const post = (data: unknown) => fetch('/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth, 'Idempotency-Key': key },
      body: JSON.stringify(data),
    })
    const replay = await post(body)
    const different = await post({ ...body, collector: { ...body.collector, note: 'Uma revisão diferente' } })
    return { order: await replay.json(), conflict: different.status }
  }, { body: request.postDataJSON(), key: headers['idempotency-key'], auth: headers.authorization })
  expect(result.order.id).toBe(new URL(page.url()).pathname.split('/').at(-1))
  expect(result.order.status).toBe('confirmed')
  expect(result.conflict).toBe(409)
  const orderUrl = page.url()
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  await page.getByRole('button', { name: 'Sair' }).click()
  await page.goto(orderUrl)
  await page.getByRole('link', { name: 'Entrar e continuar' }).click()
  await page.getByLabel('E-mail').fill('bia@kurio.test')
  await page.getByLabel('Senha').fill('KurioDemo456!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Pedido não encontrado.')
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toHaveCount(0)
})

test('handles refused connection, disconnects and preserves cart after rejected payment', async ({ page }) => {
  await checkout(page)
  await scenario(page, 'connection-refused')
  await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('A carteira recusou a conexão.')
  await scenario(page, 'reject')
  await review(page)
  await page.getByRole('button', { name: 'Desconectar carteira', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled()
  await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toHaveText('A carteira recusou o pagamento simulado.')
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(page.getByTestId('cart-total')).toHaveText('1.206 ETH')
})

test('recovers the committed order after a timeout without sending another purchase', async ({ page }) => {
  await checkout(page)
  await scenario(page, 'timeout-after-commit')
  await review(page)
  let posts = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/v1/orders' && request.method() === 'POST') posts++
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toContainText('Não recebemos a resposta', { timeout: 14_000 })
  await page.reload()
  await page.getByRole('button', { name: 'Recuperar tentativa' }).click()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  expect(posts).toBe(1)
})

test('retries the same key after a timeout before the order is created', async ({ page }) => {
  await checkout(page)
  await scenario(page, 'timeout-before-commit')
  await review(page)
  const keys: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/orders') {
      keys.push(request.headers()['idempotency-key'])
    }
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toContainText('Não recebemos a resposta', { timeout: 14_000 })
  const recovery = page.waitForResponse((response) => new URL(response.url()).pathname.startsWith('/api/v1/order-attempts/'))
  await page.getByRole('button', { name: 'Recuperar tentativa' }).click()
  expect((await recovery).status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  expect(keys).toHaveLength(2)
  expect(keys[0]).toBeTruthy()
  expect(keys[1]).toBe(keys[0])
})

test('requires a new review when the cart changes after quoting', async ({ page, context }) => {
  await checkout(page)
  await review(page)
  const otherTab = await context.newPage()
  await otherTab.goto('/cart')
  await otherTab.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(otherTab.getByTestId('cart-total')).toHaveText('2.396 ETH')
  await otherTab.close()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toContainText('A cotação mudou')
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByText('2.396 ETH')).toBeVisible()
})

test('updates the cart and requires a new checkout review after a market event', async ({ page }) => {
  await checkout(page)
  await review(page)
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  const market = { nftId: 'emerald-ape-042', editionId: 'limited' }
  await socketCommand(page, { ...market, priceEth: '2.34' })
  await expect(page.getByRole('status').filter({ hasText: 'A cotação mudou' })).toBeVisible()
  await expect(confirm).toBeDisabled()
  await page.getByRole('button', { name: 'Editar dados' }).click()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByText('2.356 ETH')).toBeVisible()
  await expect(confirm).toBeEnabled()
  await socketCommand(page, 'replay')
  await socketCommand(page, 'older')
  await expect(confirm).toBeEnabled()

  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(page.getByText('O mercado atualizou o preço ou o estoque de um item.')).toBeVisible()
  await expect(page.getByTestId('cart-total')).toHaveText('2.356 ETH')
  await socketCommand(page, { ...market, available: 0 })
  await expect(page.getByText('Estoque disponível: 0. Revise este item.')).toBeVisible()
  await expect(page.getByTestId('cart-total')).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('Estoque disponível: 0. Revise este item.')).toBeVisible()
  await socketCommand(page, 'offline')
  await socketCommand(page, { ...market, priceEth: '3.1', available: 2 })
  await expect(page.getByText('Estoque disponível: 0. Revise este item.')).toBeVisible()
  await socketCommand(page, 'online')
  await expect(page.getByTestId('cart-total')).toHaveText('3.116 ETH')
})

test('receives the confirmed order while connected and recovers a second order after a socket outage', async ({ page }) => {
  await checkout(page)
  await review(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Atualizações em tempo real conectadas.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible({ timeout: 4500 })

  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()
  await page.getByRole('link', { name: 'Carrinho', exact: true }).click()
  await page.getByRole('link', { name: /Finalizar compra|Conectar e finalizar/ }).click()
  await review(page)
  let posts = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/orders') posts++
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Pagamento pendente.')).toBeVisible()
  await socketCommand(page, 'offline')
  await expect(page.getByText('Reconectando. Consultando o pedido pela API.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
  await socketCommand(page, 'online')
  expect(posts).toBe(1)
})
