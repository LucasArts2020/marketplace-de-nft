import { expect, test, type Page, type TestInfo } from '@playwright/test'

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(async () => {
    await document.fonts.load('16px "Roboto Mono Variable"', 'Kurio')
    const images = Array.from(document.images)
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode()))
  })
  const dimensions = await page.evaluate(() => ({
    visible: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
    font: Array.from(document.fonts).some((font) => font.family.includes('Roboto Mono Variable') && font.status === 'loaded'),
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.visible)
  expect(dimensions.visible).toBe(page.viewportSize()?.width)
  expect(dimensions.font).toBe(true)
  const path = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path, animations: 'disabled', scale: 'css' })
  await testInfo.attach(name, { path, contentType: 'image/png' })
  const viewport = page.viewportSize()
  if (viewport?.width === 390) {
    await page.setViewportSize({ ...viewport, width: 320 })
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(320)
    await page.setViewportSize(viewport)
  }
}

test('renders the purchase flow with local art and without horizontal overflow', async ({ page }, testInfo) => {
  const widths = testInfo.project.name === 'desktop' ? [1440, 768] : [390]
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Resultados do catálogo' })).toBeVisible()
    const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
    await expect(navigation).toHaveCSS('position', width < 768 ? 'fixed' : 'static')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      window.scrollTo(0, 0)
    })
    await capture(page, testInfo, `catalogo-${width}`)
    const filters = page.getByRole('complementary', { name: 'Filtros do catálogo' })
    if (width < 768) {
      await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toBeVisible()
      await expect(navigation.getByRole('link', { name: 'Criadores' })).toHaveAttribute('href', '/creators')
      await page.getByRole('button', { name: 'Filtros do catálogo' }).click()
    }
    await testInfo.attach(`filtros-${width}`, {
      body: await filters.screenshot({ animations: 'disabled', scale: 'css' }),
      contentType: 'image/png',
    })
    if (width >= 768) {
      await expect(navigation.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
      const trigger = navigation.getByRole('button', { name: 'Abrir busca' })
      await trigger.hover()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await trigger.click()
      await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger).toBeFocused()
    }
    const editorial = page.getByRole('region', { name: 'Diário da Cunhagem' })
    await expect(editorial.getByRole('article')).toHaveCount(4)
    for (const [name, section] of [
      ['banners', page.getByRole('region', { name: 'Destaques do mercado' })],
      ['diario', editorial],
      ['rodape', page.getByRole('contentinfo')],
    ] as const) {
      await testInfo.attach(`${name}-${width}`, {
        body: await section.screenshot({ animations: 'disabled', scale: 'css' }),
        contentType: 'image/png',
      })
    }
    if (width !== 768) {
      if (width >= 768) {
        const learn = navigation.getByRole('link', { name: 'Aprenda' })
        await learn.click()
        await expect(page).toHaveURL(/#diario-da-cunhagem$/)
        await expect(learn).toHaveAttribute('aria-current', 'page')
        await expect(navigation.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current', 'page')
      }
      await editorial.getByText('Ler mais sobre Como funciona a propriedade de NFTs', { exact: true }).click()
      await expect(editorial.getByText(/Confira o endereço do contrato/)).toBeVisible()
      await page.getByRole('link', { name: 'Explorar lançamentos' }).click()
      await expect(page).toHaveURL(/[?&]tab=new/)
      await expect(page.getByRole('button', { name: 'Novos lançamentos' })).toHaveAttribute('aria-pressed', 'true')
    }

    await page.goto('/nfts/emerald-ape-042')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await capture(page, testInfo, `detalhe-${width}`)
    const related = page.getByRole('region', { name: 'Mais desta coleção' })
    await expect(related.getByRole('link', { name: /Cosmic Bloom/ })).toBeVisible()
    await testInfo.attach(`colecao-${width}`, {
      body: await related.screenshot({ animations: 'disabled', scale: 'css' }),
      contentType: 'image/png',
    })
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()
    if (width >= 768) await expect(navigation.getByRole('link', { name: 'Carrinho' })).toHaveAttribute('aria-description', '1 item')
    await page.getByRole('link', { name: 'Carrinho', exact: true }).click()
    await expect(page.getByTestId('cart-total')).toBeVisible()
    await capture(page, testInfo, `carrinho-${width}`)

    await page.getByRole('link', { name: /Finalizar compra|Conectar e finalizar/ }).click()
    if (width !== 768) {
      await page.getByRole('link', { name: 'Entrar e continuar' }).click()
      await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
      await capture(page, testInfo, `login-${width}`)
      await page.getByRole('button', { name: 'Mostrar', exact: true }).click()
      await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text')
      await page.getByRole('button', { name: 'Ocultar', exact: true }).click()
      await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password')
      await page.getByLabel('E-mail').fill('ana@kurio.test')
      await page.getByLabel('Senha').fill('KurioDemo123!')
      await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    }
    await expect(page.getByRole('button', { name: 'Conectar carteira', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Seus NFTs' })).toBeVisible()
    await capture(page, testInfo, `pagamento-${width}`)
    await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
    await page.getByLabel('Nome do perfil').fill('Ana Colecionadora')
    await page.getByLabel('Código de indicação').fill('KURIO')
    await page.getByLabel('Nome ENS').fill('ana.eth')
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeVisible()
    await capture(page, testInfo, `recibo-${width}`)
    await page.getByRole('button', { name: 'Fechar pedido' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await page.getByRole('link', { name: 'Perfil', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await capture(page, testInfo, `perfil-${width}`)
    await page.getByRole('link', { name: 'Carteiras', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Gerenciar carteiras' })).toBeVisible()
    await capture(page, testInfo, `carteiras-${width}`)
  }
})

test('fits the mobile authentication screens and preserves the return destination', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile')
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 780 })
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/login\?returnTo=%2F$/)
    await page.goto('/login?returnTo=%2Fcart')
    await capture(page, testInfo, `entrar-${width}`)
    await page.getByRole('link', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/register\?returnTo=%2Fcart$/)
    await capture(page, testInfo, `cadastro-${width}`)
    await page.getByLabel('Confirmar senha').focus()
    await page.setViewportSize({ width, height: 420 })
    await page.getByRole('button', { name: 'Criar perfil' }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: 'Criar perfil' })).toBeInViewport()
    await page.getByRole('link', { name: 'Entre', exact: true }).click()
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcart$/)
  }
})
