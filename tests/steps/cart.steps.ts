// Steps written by the Automatizador agent (qa-automatizador) for QAL-004. Cart calls go through `page.request`,
// which shares cookies with the page: an API "given" and the browser in the same scenario see the same cart.
import { expect, type Page } from '@playwright/test'
import { formatPrice } from '../../lib/catalog/query'
import { Given, Then, When, type ApiCall } from './fixtures'

type CartBody = {
  items: { slug: string; name: string; quantity: number }[]
  totals: Record<'subtotalCents' | 'discountCents' | 'shippingCents' | 'totalCents' | 'vatIncludedCents', number>
}

const money = (text: string) => text.replace(/\s/g, ' ').trim()

async function cartCall(page: Page, operationId: string, method: string, url: string, data?: unknown): Promise<ApiCall> {
  const res = await page.request.fetch(url, { method, data })
  return { operationId, status: res.status(), body: await res.json() }
}

/** "manta-punto-gruesa x2, taza-desayuno-xl x1" → [[slug, qty]] */
function parseContent(content: string): [string, number][] {
  return content.split(',').map((part) => {
    const [slug, qty] = part.trim().split(/\s+x/)
    return [slug, Number(qty)]
  })
}

Given('un carrito con {string}', async ({ page, world }, content: string) => {
  for (const [slug, quantity] of parseContent(content)) {
    world.api = await cartCall(page, 'addCartItem', 'POST', '/api/cart/items', { slug, quantity })
    expect(world.api.status, JSON.stringify(world.api.body)).toBe(200)
  }
})

Given('el cupón {string} aplicado', async ({ page, world }, code: string) => {
  if (code === 'ninguno') return
  world.api = await cartCall(page, 'applyCoupon', 'POST', '/api/cart/coupon', { code })
  expect(world.api.status, JSON.stringify(world.api.body)).toBe(200)
})

When('añado por la API {int} unidades de {string}', async ({ page, world }, quantity: number, slug: string) => {
  world.api = await cartCall(page, 'addCartItem', 'POST', '/api/cart/items', { slug, quantity })
})

When(/^añado por la API la cantidad (.+) de "([^"]+)"$/, async ({ page, world }, raw: string, slug: string) => {
  // Equivalence classes include non-numbers: the raw table value goes into the JSON as written.
  world.api = await cartCall(page, 'addCartItem', 'POST', '/api/cart/items', { slug, quantity: JSON.parse(raw) })
})

When('cambio por la API la cantidad de {string} a {int}', async ({ page, world }, slug: string, quantity: number) => {
  world.api = await cartCall(page, 'setCartItemQuantity', 'PATCH', `/api/cart/items/${slug}`, { quantity })
})

When('aplico por la API el cupón {string}', async ({ page, world }, code: string) => {
  world.api = await cartCall(page, 'applyCoupon', 'POST', '/api/cart/coupon', { code })
})

When('consulto el carrito por la API', async ({ page, world }) => {
  world.api = await cartCall(page, 'getCart', 'GET', '/api/cart')
})

When('dejo en el carrito solo {string}', async ({ page, world }, content: string) => {
  const current = (await cartCall(page, 'getCart', 'GET', '/api/cart')).body as CartBody
  for (const item of current.items) await cartCall(page, 'removeCartItem', 'DELETE', `/api/cart/items/${item.slug}`)
  for (const [slug, quantity] of parseContent(content)) {
    world.api = await cartCall(page, 'addCartItem', 'POST', '/api/cart/items', { slug, quantity })
  }
})

Then('el carrito tiene {int} línea con {int} unidades de {string}', async ({ world }, lines: number, units: number, slug: string) => {
  const body = world.api!.body as CartBody
  expect(body.items).toHaveLength(lines)
  expect(body.items.find((i) => i.slug === slug)?.quantity).toBe(units)
})

const totalStep = (key: keyof CartBody['totals']) => async ({ world }: { world: { api?: ApiCall } }, amount: string) => {
  expect(money(formatPrice((world.api!.body as CartBody).totals[key]))).toBe(amount)
}
Then('el subtotal es {string}', totalStep('subtotalCents'))
Then('el envío es {string}', totalStep('shippingCents'))
Then('el total es {string}', totalStep('totalCents'))
Then('el IVA incluido es {string}', totalStep('vatIncludedCents'))
Then('el descuento es {string}', totalStep('discountCents'))

// Interface
When('añado {int} unidades al carrito', async ({ page }, quantity: number) => {
  await page.getByLabel('Cantidad').selectOption(String(quantity))
  await page.getByRole('button', { name: 'Añadir al carrito' }).click()
  await expect(page.getByTestId('cart-message')).toHaveText('Añadido al carrito')
})

When('abro el carrito', async ({ page }) => {
  await page.goto('/carrito')
})

When('recargo la página', async ({ page }) => {
  await page.reload()
})

Then('la cabecera muestra {string}', async ({ page }, text: string) => {
  await expect(page.getByTestId('cart-link')).toHaveText(text)
})

Then('el carrito tiene una línea de {string} con {int} unidades', async ({ page }, name: string, units: number) => {
  await expect(page.getByLabel(`Cantidad de ${name}`)).toHaveValue(String(units))
})

When('cambio la cantidad de {string} a {int}', async ({ page }, name: string, units: number) => {
  await page.getByLabel(`Cantidad de ${name}`).selectOption(String(units))
  await expect(page.getByLabel(`Cantidad de ${name}`)).toHaveValue(String(units))
})

When('elimino {string} del carrito', async ({ page }, name: string) => {
  await page.getByRole('button', { name: `Eliminar ${name}` }).click()
  await expect(page.getByRole('button', { name: `Eliminar ${name}` })).toHaveCount(0)
})

When('abro la tienda en otro navegador', async ({ browser, world }) => {
  const other = await browser.newContext({ baseURL: 'http://localhost:3410' })
  const page = await other.newPage()
  await page.goto('/carrito')
  world.otherPageText = (await page.getByRole('heading', { level: 1 }).textContent()) ?? ''
  await other.close()
})

Then('ese navegador ve {string}', async ({ world }, text: string) => {
  expect(world.otherPageText).toBe(text)
})

Then('la página muestra el total {string}', async ({ page }, amount: string) => {
  await expect(page.getByTestId('total-total')).toHaveText(new RegExp(`^${amount.replace(' €', '\\s€')}$`))
})

Then('la página indica que faltan {string} para el envío gratis', async ({ page }, amount: string) => {
  await expect(page.getByTestId('free-shipping-hint')).toContainText(amount.replace(' €', ''))
})

When('aplico en la página el cupón {string}', async ({ page }, code: string) => {
  await page.getByLabel('Cupón de descuento').fill(code)
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByTestId('coupon-message')).toHaveText('Cupón aplicado')
})

When('quito el cupón en la página', async ({ page }) => {
  await page.getByRole('button', { name: /^Quitar el cupón/ }).click()
  await expect(page.getByRole('button', { name: /^Quitar el cupón/ })).toHaveCount(0)
})

Then('la página muestra el descuento {string}', async ({ page }, amount: string) => {
  await expect(page.getByTestId('total-discount')).toHaveText(new RegExp(`^${amount.replace(' €', '\\s€')}$`))
})

Then('veo el aviso del cupón {string}', async ({ page }, text: string) => {
  await expect(page.getByTestId('coupon-warning')).toContainText(text.replace(' €', ''))
})
