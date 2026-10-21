// Steps written by the Automatizador agent (qa-automatizador) for QAL-010: storefront, catalogue drawer and chips,
// add from card, empty cart suggestions, free-shipping bar and checkout steps.
import { expect, type Locator, type Page } from '@playwright/test'
import { Given, Then, When } from './fixtures'

const cards = (scope: Page | Locator) => scope.getByTestId('product-card')
const slugs = (scope: Locator) => cards(scope).evaluateAll((els) => els.map((e) => e.getAttribute('data-slug')))
const SECTIONS: Record<string, string> = { 'Mejor valorados': 'home-best', Novedades: 'home-news' }

// SHOP-001
When('busco {string} en la cabecera', async ({ page }, text: string) => {
  await page.getByLabel('Buscar en la tienda').fill(text)
  await page.getByLabel('Buscar en la tienda').press('Enter')
  await page.waitForURL(/\/catalogo\?/)
})

Then('estoy en el catálogo buscando {string}', async ({ page }, text: string) => {
  await expect(page).toHaveURL((url) => url.pathname === '/catalogo' && url.searchParams.get('q') === text)
  await expect(page.getByLabel('Buscar', { exact: true })).toHaveValue(text)
})

When('elijo {string} en el menú de categorías', async ({ page }, name: string) => {
  await page.getByRole('navigation', { name: 'Departamentos' }).getByRole('link', { name, exact: true }).click()
  await page.waitForURL(/category=/)
})

// SHOP-002
Then('la portada ofrece las {int} categorías', async ({ page }, count: number) => {
  await expect(page.getByTestId('home-categories').getByRole('listitem')).toHaveCount(count)
})

Then('{string} muestra {int} artículos con stock', async ({ page }, section: string, count: number) => {
  const scope = page.getByTestId(SECTIONS[section])
  await expect(cards(scope)).toHaveCount(count)
  await expect(cards(scope).filter({ hasText: 'Agotado' })).toHaveCount(0)
})

Then('{string} no repite ningún artículo de {string}', async ({ page }, a: string, b: string) => {
  const first = await slugs(page.getByTestId(SECTIONS[a]))
  const second = await slugs(page.getByTestId(SECTIONS[b]))
  expect(first.length).toBeGreaterThan(0)
  expect(first.filter((s) => second.includes(s))).toEqual([])
})

// SHOP-003
Then('la foto principal describe el artículo y la sirve la propia tienda', async ({ page }) => {
  const img = page.getByRole('main').getByRole('img').first()
  await expect(img).toHaveAttribute('alt', /\S{3,}/)
  const { src, loaded } = await img.evaluate((el: HTMLImageElement) => ({ src: el.currentSrc, loaded: el.complete && el.naturalWidth > 0 }))
  expect(new URL(src).origin, 'la foto la sirve la tienda').toBe(new URL(page.url()).origin)
  expect(loaded, 'la foto se ha cargado').toBe(true)
})

// SHOP-004
When('sigo {string} en el pie', async ({ page }, name: string) => {
  await page.getByRole('contentinfo').getByRole('link', { name }).click()
  await page.waitForLoadState()
})

Then('veo los créditos de {int} fotos con su autor y su licencia', async ({ page }, count: number) => {
  const rows = page.getByRole('table', { name: 'Fotos y sus autores' }).locator('tbody tr')
  await expect(rows).toHaveCount(count)
  await expect(rows.filter({ hasText: 'Unsplash License' })).toHaveCount(count)
})

// CAT-010
When('elijo la categoría {string} sin aplicar', async ({ page }, name: string) => {
  const select = page.getByLabel('Categoría')
  const value = await select.locator('option', { hasText: name }).getAttribute('value')
  await select.selectOption(value!)
  await page.waitForURL(new RegExp(`category=${value}`))
})

Then('la dirección incluye {string}', async ({ page }, text: string) => {
  await expect(page).toHaveURL((url) => url.search.includes(text))
})

Then('la dirección no incluye {string}', async ({ page }, text: string) => {
  await expect(page).toHaveURL((url) => !url.search.includes(text))
})

When('quito el filtro {string}', async ({ page }, label: string) => {
  await page.getByRole('link', { name: `Quitar filtro: ${label}` }).click()
  await expect(page.getByRole('link', { name: `Quitar filtro: ${label}` })).toHaveCount(0)
})

Then('el filtro {string} sigue activo', async ({ page }, label: string) => {
  await expect(page.getByRole('link', { name: `Quitar filtro: ${label}` })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: label })).toBeChecked()
})

// CAT-011
Given('una pantalla de {int} px de ancho', async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: 844 })
})

Then('el primer artículo se ve sin desplazarse', async ({ page }) => {
  await expect(cards(page).first()).toBeInViewport({ ratio: 0.3 })
})

Then('los filtros están ocultos tras el botón {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('form', { name: 'Buscar y filtrar' })).toBeHidden()
  await expect(page.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible()
})

When('abro los filtros', async ({ page }) => {
  await page.getByRole('button', { name: /^Filtros/ }).click()
  await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible()
})

Then('el foco está en el cajón de filtros', async ({ page }) => {
  const inside = await page.getByRole('dialog', { name: 'Filtros' }).evaluate((el) => el.contains(document.activeElement))
  expect(inside).toBe(true)
})

When('pulso Escape', async ({ page }) => {
  await page.keyboard.press('Escape')
})

Then('el cajón se cierra y el foco vuelve al botón {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name: 'Filtros' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: new RegExp(`^${name}`) })).toBeFocused()
})

// CAT-012
Then('veo hasta {int} relacionados de {string} sin el {string}', async ({ page }, max: number, category: string, name: string) => {
  const related = cards(page.getByTestId('related'))
  const count = await related.count()
  expect(count).toBeGreaterThan(0)
  expect(count).toBeLessThanOrEqual(max)
  for (const card of await related.all()) {
    await expect(card).toContainText(category)
    await expect(card.getByTestId('product-name')).not.toHaveText(name)
  }
})

// CART-006
When('añado {string} desde su tarjeta', async ({ page, world }, name: string) => {
  await page.getByRole('button', { name: `Añadir ${name} al carrito` }).click()
  world.added = name
})

Then('sigo en el catálogo', async ({ page }) => {
  await expect(page).toHaveURL((url) => url.pathname === '/catalogo')
})

Then('la tarjeta avisa {string}', async ({ page }, text: string) => {
  await expect(page.getByTestId('card-cart-message')).toHaveText(text)
})

Then('ninguna tarjeta agotada tiene botón de añadir', async ({ page }) => {
  const soldOut = cards(page).filter({ hasText: 'Agotado' })
  expect(await soldOut.count()).toBeGreaterThan(0)
  for (const card of await soldOut.all()) await expect(card.getByRole('button', { name: /^Añadir/ })).toHaveCount(0)
})

// CART-007
Then('veo {int} sugerencias', async ({ page }, count: number) => {
  await expect(cards(page.getByTestId('cart-suggestions'))).toHaveCount(count)
})

When('añado la primera sugerencia', async ({ page, world }) => {
  const first = cards(page.getByTestId('cart-suggestions')).first()
  world.added = (await first.getByTestId('product-name').textContent())!.trim()
  await first.getByRole('button', { name: `Añadir ${world.added} al carrito` }).click()
})

Then('el carrito tiene la sugerencia con {int} unidad(es)', async ({ page, world }, units: number) => {
  await expect(page.getByLabel(`Cantidad de ${world.added}`)).toHaveValue(String(units))
})

// PROMO-005
Then('la barra de envío gratis está al {int} %', async ({ page }, percent: number) => {
  await expect(page.getByRole('progressbar', { name: 'Progreso hacia el envío gratis' })).toHaveAttribute('aria-valuenow', String(percent))
})

// CHK-006
Then('el paso actual es {string}', async ({ page }, step: string) => {
  await expect(page.getByRole('list', { name: 'Pasos de la compra' }).locator('[aria-current="step"]')).toContainText(step)
})

// EXP-006: next/image marks priority photos as eager (fetchpriority high) and the rest as lazy.
Then('las {int} primeras fotos se cargan con prioridad y las demás en diferido', async ({ page }, first: number) => {
  const loading = await cards(page).locator('img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('loading') ?? 'eager'))
  expect(loading.length).toBeGreaterThan(first)
  expect(loading.slice(0, first)).toEqual(Array(first).fill('eager'))
  expect(loading.slice(first).every((l) => l === 'lazy')).toBe(true)
})
