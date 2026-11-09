import { expect, test } from '@playwright/test'

test('lists creator profiles and opens an NFT from their collection', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Criadores', exact: true }).click()
  await expect(page).toHaveURL(/\/creators$/)
  const profile = page.getByRole('article', { name: 'Ana Costa' })
  await expect(profile.getByRole('img', { name: 'Avatar ilustrado de Ana Costa' })).toBeVisible()
  await expect(profile.getByRole('listitem')).toHaveCount(2)
  await profile.getByRole('link', { name: /Emerald Ape/ }).click()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})
