import { expect, test } from '@playwright/test'

test('restores persisted market and cart fixtures on reset', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-042')
  const heading = page.getByRole('heading', { name: 'Emerald Ape #042' })
  const visiblePrice = (value: string) => page.getByText(value, { exact: true }).filter({ visible: true })
  await expect(heading).toBeVisible()
  const buy = page.getByRole('button', { name: /adicionar ao carrinho/i })
  await buy.click()
  await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()
  const edited = await page.evaluate(async () => (await fetch('/__demo/socket', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nftId: 'emerald-ape-042', editionId: 'limited', priceEth: '7.15' }),
  })).status)
  expect(edited).toBe(204)
  await expect(visiblePrice('7.15 ETH')).toBeVisible()
  await page.reload()
  await expect(visiblePrice('7.15 ETH')).toBeVisible()
  expect(await page.evaluate(async () => {
    const response = await fetch('/__demo/reset', { method: 'POST' })
    if (response.ok) localStorage.removeItem('kurio.guest')
    return response.status
  })).toBe(204)
  await page.reload()
  await expect(visiblePrice('1.19 ETH')).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('renders catalog from the MSW REST response in preview', async ({ page }) => {
  const response = page.waitForResponse('**/api/v1/nfts?page=1&pageSize=9')
  await page.goto('/')
  expect((await response).fromServiceWorker()).toBe(true)
  await expect(page.getByRole('region', { name: 'Resultados do catálogo' })
    .getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('receives real Socket.IO events before and after an interrupted connection', async ({ page }) => {
  await page.goto('/demo/socket')
  await expect(page.getByRole('status')).toHaveText('Conectado')
  await page.getByRole('button', { name: 'Publicar evento' }).click()
  await expect(page.getByText('Versão recebida: 2')).toBeVisible()

  await page.getByRole('button', { name: 'Interromper conexão' }).click()
  await expect(page.getByRole('status')).toHaveText('Desconectado')
  await expect(page.getByRole('status')).toHaveText('Conectado')
  await expect(page.getByText('Conexões estabelecidas: 2')).toBeVisible()
  await page.getByRole('button', { name: 'Publicar evento' }).click()
  await expect(page.getByText('Versão recebida: 3')).toBeVisible()

  const response = await page.evaluate(async () => (await fetch('/api/v1/nfts')).json())
  expect(response.catalogVersion).toBe(3)
})
