import { expect, test, type Page } from '@playwright/test'

function results(page: Page) {
  return page.getByRole('region', { name: 'Resultados do catálogo' })
}

async function search(page: Page, term: string) {
  await openSearch(page)
  await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill(term)
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
}

async function openSearch(page: Page) {
  if (page.viewportSize()!.width >= 768) await page.getByRole('button', { name: 'Abrir busca' }).click()
}

async function openFilters(page: Page) {
  if (page.viewportSize()!.width < 768) await page.getByRole('button', { name: 'Filtros do catálogo' }).click()
}

async function scenario(page: Page, command: 'slow' | 'fail-next') {
  const status = await page.evaluate(async (body) => {
    const response = await fetch('/__demo/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return response.status
  }, command)
  expect(status).toBe(204)
}

test('restores page and combines facets, sorting and text search through the URL', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Próxima' }).click()
  await expect(page).toHaveURL(/[?&]page=2/)
  await expect(results(page).getByRole('heading', { name: 'Silver Garden #021' })).toBeVisible()
  await openFilters(page)
  await page.getByRole('button', { name: 'Arte digital', exact: true }).click()
  await expect(page).not.toHaveURL(/[?&]page=/)
  await expect(results(page).getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.goBack()
  await expect(results(page).getByRole('heading', { name: 'Silver Garden #021' })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('button', { name: 'Arte digital', exact: true })).toHaveAttribute('aria-pressed', 'true')
  if (page.viewportSize()!.width >= 768) await page.getByText('Séries', { exact: true }).click()
  await page.getByRole('button', { name: 'Kurio Editions', exact: true }).click()

  const filtered = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/v1/nfts' && url.searchParams.get('sort') === 'price-desc' &&
      url.searchParams.get('category[]') === 'Arte digital' &&
      url.searchParams.get('collection[]') === 'Kurio Editions'
  })
  await page.getByLabel('Ordenar por').selectOption('price-desc')
  expect((await filtered).fromServiceWorker()).toBe(true)
  await expect(results(page).getByRole('heading')).toHaveText([
    'Emerald Ape #042', 'Golden Beat #207', 'Silver Garden #021',
  ])
  await search(page, 'Emerald')
  await expect(results(page).getByRole('heading')).toHaveText(['Emerald Ape #042'])
  await page.reload()
  await openSearch(page)
  await expect(page.getByRole('searchbox')).toHaveValue('Emerald')
  await expect(page.getByLabel('Ordenar por')).toHaveValue('price-desc')
  if (page.viewportSize()!.width >= 768) await page.getByText('Séries (1)', { exact: true }).click()
  else await openFilters(page)
  await expect(page.getByRole('button', { name: 'Kurio Editions', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await search(page, 'inexistente')
  await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
  await page.goto('/')
  await openFilters(page)
  await page.getByRole('button', { name: 'Ethereum', exact: true }).click()
  await expect(results(page).getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  expect([...new URL(page.url()).searchParams.keys()]).toEqual(['network'])
  await page.getByRole('slider', { name: 'Mínimo ETH' }).press('Home')
  await page.getByRole('slider', { name: 'Máximo ETH' }).press('Home')
  await page.getByRole('slider', { name: 'Máximo ETH' }).press('ArrowRight')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
  await page.reload()
  await openFilters(page)
  await expect(page.getByRole('button', { name: 'Ethereum', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('slider', { name: 'Máximo ETH' })).toHaveValue('0.01')
  await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
})

test('applies the drafted price range and clears it without removing other filters', async ({ page }) => {
  await page.goto('/?minPrice=1.18&maxPrice=1.20')
  await openFilters(page)
  const ethereum = page.getByRole('button', { name: 'Ethereum', exact: true })
  await ethereum.click()
  const names = results(page).getByRole('heading')
  await expect(names).toHaveText(['Emerald Ape #042'])

  const maximum = page.getByRole('slider', { name: 'Máximo ETH' })
  await maximum.press('Home')
  await expect(maximum).toHaveValue('1.18')
  await expect(names).toHaveText(['Emerald Ape #042'])
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(results(page).getByText('Nenhum NFT encontrado.')).toBeVisible()

  await maximum.press('ArrowRight')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(names).toHaveText(['Emerald Ape #042'])
  await page.reload()
  await openFilters(page)
  await expect(maximum).toHaveValue('1.19')
  await page.getByRole('button', { name: 'Limpar preço', exact: true }).click()
  await expect(page).not.toHaveURL(/(?:min|max)Price=/)
  await expect(ethereum).toHaveAttribute('aria-pressed', 'true')
  await expect(names).toHaveCount(6)
  await ethereum.click()
  await expect(page).not.toHaveURL(/\?network=/)
  await expect(names).toHaveCount(9)
})

test('keeps the catalog in view when changing tab and sort', async ({ page }) => {
  await page.goto('/')
  await expect(results(page).getByRole('heading').first()).toBeVisible()
  const tab = page.getByRole('button', { name: 'Novos lançamentos', exact: true })
  await tab.evaluate((element) => window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 100))
  const scroll = await page.evaluate(() => window.scrollY)
  expect(scroll).toBeGreaterThan(0)

  await tab.click()
  await expect(page).toHaveURL(/[?&]tab=new/)
  await expect(results(page).getByRole('heading')).toHaveCount(6)
  expect(Math.abs(await page.evaluate(() => window.scrollY) - scroll)).toBeLessThan(4)

  await page.getByLabel('Ordenar por').selectOption('price-desc')
  await expect(page).toHaveURL(/[?&]sort=price-desc/)
  await expect(results(page).getByRole('heading').first()).toHaveText('Neon Vessel #552')
  expect(Math.abs(await page.evaluate(() => window.scrollY) - scroll)).toBeLessThan(4)
})

test('opens detail directly, changes gallery and enforces edition stock', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.getByRole('button', { name: 'Imagem 2' }).click()
  await expect(page.getByRole('button', { name: 'Imagem 2' })).toHaveAttribute('aria-pressed', 'true')
  const zoom = page.getByRole('button', { name: 'Ampliar imagem' })
  await zoom.click()
  await expect(page.getByRole('dialog', { name: 'Arte ampliada' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Arte ampliada' })).not.toBeVisible()
  await expect(zoom).toBeFocused()
  const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
  await increase.click()
  await increase.click()
  await expect(page.getByLabel('Quantidade selecionada')).toHaveText('3')
  await expect(increase).toBeDisabled()
  await page.getByRole('button', { name: '1/1', exact: true }).click()
  await expect(page.getByText('Edição indisponível.')).toBeVisible()
  await expect(increase).toBeDisabled()
  await page.getByRole('button', { name: 'Avaliações de colecionadores (19)' }).click()
  await expect(page.getByText(/19 avaliações simuladas/)).toBeVisible()
  const related = page.getByRole('region', { name: 'Mais desta coleção' })
  await expect(related.getByRole('link', { name: /Cosmic Bloom/ })).toBeVisible()
  await expect(related.getByRole('link', { name: /Emerald Ape/ })).toHaveCount(0)

  await page.goto('/nfts/inexistente')
  await expect(page.getByRole('alert')).toHaveText('NFT não encontrado.')
})

test('shows shimmer, cancels a slow obsolete search and retries an HTTP 503', async ({ page }) => {
  await page.goto('/')
  await expect(results(page).getByRole('heading').first()).toBeVisible()
  await scenario(page, 'slow')
  const matchesSlowSearch = (url: string) => new URL(url).searchParams.get('q') === 'Emerald'
  const started = page.waitForRequest((request) => matchesSlowSearch(request.url()))
  const cancelled = page.waitForEvent('requestfailed', (request) => matchesSlowSearch(request.url()))
  await search(page, 'Emerald')
  await started
  await expect(page.getByText('Carregando NFTs', { exact: true })).toBeAttached()
  await search(page, 'Sage')
  expect((await cancelled).failure()?.errorText).toBe('net::ERR_ABORTED')
  await expect(results(page).getByRole('heading')).toHaveText(['Sage Nomad #009'])

  await scenario(page, 'fail-next')
  await search(page, 'Cosmic')
  await expect(page.getByRole('alert')).toHaveText('Não foi possível carregar o catálogo.')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(results(page).getByRole('heading')).toHaveText(['Cosmic Bloom #118'])
})

test('keeps loading feedback without shimmer for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(results(page).getByRole('heading').first()).toBeVisible()
  await scenario(page, 'slow')
  await search(page, 'Emerald')
  const shimmer = results(page).locator('.skeleton').first()
  await expect(shimmer).toHaveCSS('animation-name', 'none')
  await expect(results(page).getByRole('heading')).toHaveText(['Emerald Ape #042'])
})
