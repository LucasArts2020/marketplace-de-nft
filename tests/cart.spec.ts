import { expect, test, type Page } from '@playwright/test'

async function addItem(page: Page, quantity = 1) {
  await page.goto('/nfts/emerald-ape-042')
  for (let index = 1; index < quantity; index++) {
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  }
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()
  await page.getByRole('link', { name: 'Carrinho', exact: true }).click()
}

async function signIn(page: Page, email: string, password: string) {
  if (page.viewportSize()!.width < 768) {
    await page.getByRole('link', { name: 'Entrar', exact: true }).click()
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/cart$/)
    return
  }
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Entrar', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Entrar na conta' })
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByLabel('Senha').fill(password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page).toHaveURL(/\/cart$/)
}

test('quotes exact ETH, handles coupon errors, edits and removes a persistent guest item', async ({ page }) => {
  await addItem(page, 2)
  const total = page.getByTestId('cart-total')
  await expect(total).toHaveText('2.396 ETH')
  const coupon = page.getByLabel('Código promocional')
  const apply = page.getByRole('button', { name: 'Aplicar' })
  await coupon.fill('invalido')
  await apply.click()
  await expect(page.getByRole('alert')).toHaveText('Cupom inválido.')
  await coupon.fill('EXPIRADO')
  await apply.click()
  await expect(page.getByRole('alert')).toHaveText('O cupom expirou.')
  await coupon.fill('kurio10')
  await apply.click()
  await expect(total).toHaveText('2.158 ETH')

  await page.reload()
  await expect(total).toHaveText('2.158 ETH')
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(total).toHaveText('3.229 ETH')
  await expect(page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' })).toBeDisabled()
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(total).toHaveText('3.586 ETH')
  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('merges the guest cart once and keeps carts isolated across users and reloads', async ({ page }) => {
  await addItem(page, 2)
  await signIn(page, 'ana@kurio.test', 'KurioDemo123!')
  const quantity = page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })
  await expect(quantity).toHaveText('2')
  await page.reload()
  await expect(page.getByText('Olá, ana')).toBeVisible()
  await expect(quantity).toHaveText('2')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()

  await signIn(page, 'bia@kurio.test', 'KurioDemo456!')
  await expect(page.getByText('Olá, bia')).toBeVisible()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  await expect(quantity).toHaveCount(0)
  await page.getByRole('button', { name: 'Sair' }).click()

  await signIn(page, 'ana@kurio.test', 'KurioDemo123!')
  await expect(quantity).toHaveText('2')
})

test('preserves both carts on a merge stock conflict and blocks a quote until corrected', async ({ page }) => {
  await addItem(page, 2)
  await signIn(page, 'ana@kurio.test', 'KurioDemo123!')
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveText('2')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  await addItem(page, 2)
  await signIn(page, 'ana@kurio.test', 'KurioDemo123!')
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveText('4')
  await expect(page.getByText('Revise os itens com estoque insuficiente.')).toBeVisible()
  await expect(page.getByTestId('cart-total')).toHaveCount(0)
  await page.getByRole('button', { name: 'Diminuir quantidade de Emerald Ape #042' }).click()
  await expect(page.getByTestId('cart-total')).toHaveText('3.586 ETH')
})
