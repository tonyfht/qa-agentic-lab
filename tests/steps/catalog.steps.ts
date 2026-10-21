import { expect, type Page } from '@playwright/test'
import { Then, When } from './fixtures'

const cards = (page: Page) => page.getByTestId('product-card')

// Interface
When('abro el catálogo', async ({ page }) => {
  await page.goto('/catalogo')
})

When('abro el catálogo con {string}', async ({ page }, query: string) => {
  await page.goto(`/catalogo?${query}`)
})

When('busco {string}', async ({ page }, text: string) => {
  await page.getByLabel('Buscar', { exact: true }).fill(text)
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await page.waitForURL(/\/catalogo\?/)
})

When('filtro por la categoría {string}', async ({ page }, name: string) => {
  const select = page.getByLabel('Categoría')
  const value = await select.locator('option', { hasText: name }).getAttribute('value')
  await select.selectOption(value!)
})

When('activo {string}', async ({ page }, label: string) => {
  await page.getByLabel(label).check()
})

When('aplico los filtros', async ({ page }) => {
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await page.waitForURL(/\/catalogo\?/)
})

When('voy a la página siguiente', async ({ page }) => {
  await page.getByRole('link', { name: 'Siguiente →' }).click()
  await page.waitForURL(/page=2/)
})

When('abro la ficha del artículo {string}', async ({ page }, slug: string) => {
  await page.goto(`/producto/${slug}`)
})

Then('veo {int} artículos en la página', async ({ page }, count: number) => {
  await expect(cards(page)).toHaveCount(count)
})

Then('veo el total {string}', async ({ page }, text: string) => {
  await expect(page.getByTestId('results-total')).toHaveText(text)
})

Then('aparece el artículo {string}', async ({ page }, name: string) => {
  await expect(page.getByTestId('product-name').filter({ hasText: name })).toBeVisible()
})

Then('veo el mensaje {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible()
})

Then('hay un enlace {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('link', { name })).toBeVisible()
})

Then('todos los artículos son de la categoría {string}', async ({ page }, name: string) => {
  await expect(cards(page).first()).toBeVisible()
  for (const card of await cards(page).all()) await expect(card).toContainText(name)
})

Then('ningún artículo está agotado', async ({ page }) => {
  await expect(cards(page).first()).toBeVisible()
  await expect(cards(page).filter({ hasText: 'Agotado' })).toHaveCount(0)
})

Then('algún artículo aparece marcado como {string}', async ({ page }, text: string) => {
  await expect(cards(page).filter({ hasText: text }).first()).toBeVisible()
})

Then('veo el aviso {string}', async ({ page }, text: string) => {
  await expect(page.getByTestId('catalog-alert')).toContainText(text)
})

Then('veo el título {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('heading', { level: 1, name: text })).toBeVisible()
})

Then('veo {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible()
})
