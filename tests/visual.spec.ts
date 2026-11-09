import { expect, test, type Page } from '@playwright/test'

async function screenshot(page: Page, name: string) {
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = Array.from(document.images).filter((image) => image.getClientRects().length > 0)
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode()))
  })
  await expect(page).toHaveScreenshot(name, { animations: 'disabled', scale: 'css' })
}

test('matches the approved purchase flow layouts', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-09T12:00:00Z'))
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Resultados do catálogo' })).toBeVisible()
  await screenshot(page, 'inicio.png')

  await page.goto('/nfts/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  const buy = page.getByRole('button', { name: /adicionar ao carrinho/i })
  await expect(buy).toBeEnabled()
  await screenshot(page, 'detalhe.png')
  await buy.click()
  await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()

  await page.goto('/cart')
  await expect(page.getByTestId('cart-total')).toHaveText('1.206 ETH')
  await screenshot(page, 'carrinho.png')
  await page.getByRole('button', { name: /Finalizar compra|Conectar e finalizar/ }).click()
  await page.getByLabel('E-mail').fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!')
  await page.getByRole('dialog', { name: 'Entrar na conta' }).getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Seus NFTs' })).toBeVisible()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana')
  await screenshot(page, 'pagamento.png')
})
