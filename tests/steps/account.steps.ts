// Steps written by the Automatizador agent (qa-automatizador) for QAL-005: account, checkout, orders and the
// contract sweep of the API agent. API calls use `page.request` so they share the browser's cookies (cart and
// session); "another customer" gets a browser context of its own.
import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { E2E_PORT } from '../../qa/lib/e2e'
import { sweepableOperations } from '../support/contract-sweep'
import { Given, Then, When, type ApiCall } from './fixtures'

const DEMO = { email: 'cliente@ejemplo.test', password: 'Casa2026' }
const VALID_SHIPPING = { fullName: 'Ana García', address: 'Calle Mayor 1', city: 'Madrid', postalCode: '28013' }
const VALID_CARD = { cardNumber: '4242 4242 4242 4242', expiry: '12/30', cvc: '123' }

const uniqueEmail = (who: string) =>
  `${who.toLowerCase().replace(/[^a-z]/g, '')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@ejemplo.test`

async function api(request: APIRequestContext, operationId: string, method: string, url: string, data?: unknown): Promise<ApiCall> {
  const res = await request.fetch(url, { method, data })
  return {
    operationId,
    status: res.status(),
    body: await res.json(),
    setCookies: res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie').map((h) => h.value),
  }
}

async function register(request: APIRequestContext, name = 'Cliente') {
  const call = await api(request, 'register', 'POST', '/api/account/register', {
    name,
    email: uniqueEmail(name),
    password: DEMO.password,
  })
  expect(call.status, JSON.stringify(call.body)).toBe(201)
}

async function buy(request: APIRequestContext, content: string): Promise<string> {
  for (const part of content.split(',')) {
    const [slug, qty] = part.trim().split(/\s+x/)
    const add = await api(request, 'addCartItem', 'POST', '/api/cart/items', { slug, quantity: Number(qty) })
    expect(add.status, JSON.stringify(add.body)).toBe(200)
  }
  const order = await api(request, 'checkout', 'POST', '/api/checkout', { shipping: VALID_SHIPPING, payment: VALID_CARD })
  expect(order.status, JSON.stringify(order.body)).toBe(201)
  return (order.body as { number: string }).number
}

async function stockOf(request: APIRequestContext, slug: string) {
  return ((await (await request.get(`/api/products/${slug}`)).json()) as { stock: number }).stock
}

async function otherCustomer(browser: import('@playwright/test').Browser) {
  const context = await browser.newContext({ baseURL: `http://localhost:${E2E_PORT}` })
  await register(context.request, 'Otro')
  return context.request
}

// Account — API
Given('un cliente nuevo con sesión', async ({ page }) => {
  await register(page.request)
})

When('me registro por la API con el correo {string}', async ({ page, world }, email: string) => {
  world.api = await api(page.request, 'register', 'POST', '/api/account/register', { name: 'Ana', email, password: DEMO.password })
})

When('me registro por la API con la contraseña {string}', async ({ page, world }, password: string) => {
  world.api = await api(page.request, 'register', 'POST', '/api/account/register', {
    name: 'Ana',
    email: uniqueEmail('ana'),
    password,
  })
})

When('entro por la API con {string} y {string}', async ({ page, world }, email: string, password: string) => {
  world.api = await api(page.request, 'login', 'POST', '/api/account/login', { email, password })
})

When('pido por la API mis pedidos', async ({ page, world }) => {
  world.api = await api(page.request, 'listOrders', 'GET', '/api/orders')
})

Then('el error del campo {string} es {string}', async ({ world }, field: string, message: string) => {
  expect((world.api!.body as { fields?: Record<string, string> }).fields?.[field]).toBe(message)
})

Then('la cookie {string} es HttpOnly y SameSite=Lax', async ({ world }, name: string) => {
  const cookie = world.api!.setCookies?.find((c) => c.startsWith(`${name}=`))
  expect(cookie, 'Set-Cookie de la sesión').toBeDefined()
  expect(cookie).toMatch(/;\s*HttpOnly/i)
  expect(cookie).toMatch(/;\s*SameSite=Lax/i)
})

// Account — interface
When('me registro en la página como {string}', async ({ page }, name: string) => {
  await page.goto('/cuenta/registro')
  await page.getByLabel('Nombre').fill(name)
  await page.getByLabel('Correo').fill(uniqueEmail(name))
  await page.getByLabel('Contraseña').fill(DEMO.password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/cuenta/registro'))
})

When('abro {string}', async ({ page }, path: string) => {
  await page.goto(path)
})

When('entro en la página con el cliente de ejemplo', async ({ page }) => {
  if (!new URL(page.url()).pathname.startsWith('/cuenta/entrar')) await page.goto('/cuenta/entrar')
  await page.getByLabel('Correo').fill(DEMO.email)
  await page.getByLabel('Contraseña').fill(DEMO.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/cuenta/entrar'))
})

When('cierro la sesión', async ({ page }) => {
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page.getByTestId('greeting')).toHaveCount(0)
})

Then('la cabecera saluda {string}', async ({ page }, text: string) => {
  await expect(page.getByTestId('greeting')).toHaveText(text)
})

Then('la cabecera ofrece {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name })).toBeVisible()
})

Then('estoy en la página {string}', async ({ page }, path: string) => {
  await expect(page).toHaveURL((url) => url.pathname === path)
})

// Checkout — API
Given('anoto el stock de {string}', async ({ page, world }, slug: string) => {
  world.stock[slug] = await stockOf(page.request, slug)
})

Given('todas las unidades de {string} en mi carrito', async ({ page }, slug: string) => {
  const stock = await stockOf(page.request, slug)
  expect(stock, `queda stock de ${slug} para el escenario`).toBeGreaterThan(0)
  const add = await api(page.request, 'addCartItem', 'POST', '/api/cart/items', { slug, quantity: stock })
  expect(add.status, JSON.stringify(add.body)).toBe(200)
})

Given('otro cliente compra {int} unidad de {string}', async ({ browser }, quantity: number, slug: string) => {
  await buy(await otherCustomer(browser), `${slug} x${quantity}`)
})

When(
  'pago por la API con la tarjeta {string}, caducidad {string} y CVC {string}',
  async ({ page, world }, cardNumber: string, expiry: string, cvc: string) => {
    world.api = await api(page.request, 'checkout', 'POST', '/api/checkout', {
      shipping: VALID_SHIPPING,
      payment: { cardNumber, expiry, cvc },
    })
  },
)

When('pago por la API con el código postal {string}', async ({ page, world }, postalCode: string) => {
  world.api = await api(page.request, 'checkout', 'POST', '/api/checkout', {
    shipping: { ...VALID_SHIPPING, postalCode },
    payment: VALID_CARD,
  })
})

Then('el stock de {string} ha bajado en {int}', async ({ page, world }, slug: string, units: number) => {
  expect(await stockOf(page.request, slug)).toBe(world.stock[slug] - units)
})

Then('el stock de {string} no ha cambiado', async ({ page, world }, slug: string) => {
  expect(await stockOf(page.request, slug)).toBe(world.stock[slug])
})

Then('mi carrito está vacío', async ({ page }) => {
  expect(((await (await page.request.get('/api/cart')).json()) as { units: number }).units).toBe(0)
})

Then('mi carrito sigue con {int} unidades', async ({ page }, units: number) => {
  expect(((await (await page.request.get('/api/cart')).json()) as { units: number }).units).toBe(units)
})

Then('la respuesta del pedido no contiene {string} ni el CVC', async ({ world }, fullNumber: string) => {
  const text = JSON.stringify(world.api!.body)
  expect(text).not.toContain(fullNumber)
  expect(text).not.toMatch(/cvc/i)
  expect((world.api!.body as { card: { last4: string } }).card.last4).toBe(fullNumber.slice(-4))
})

Then('el error dice cuántas unidades quedan de {string}', async ({ page, world }, slug: string) => {
  const product = (await (await page.request.get(`/api/products/${slug}`)).json()) as { name: string; stock: number }
  const left = product.stock === 1 ? 'solo queda 1 unidad' : `solo quedan ${product.stock} unidades`
  expect((world.api!.body as { error: string }).error).toBe(`De «${product.name}» ${left}`)
})

// Checkout — interface
When('tramito el pedido', async ({ page }) => {
  await page.getByRole('link', { name: 'Tramitar pedido' }).click()
  await page.waitForURL('**/checkout')
})

async function fillShipping(page: Page, postalCode: string) {
  await page.getByLabel('Nombre completo').fill(VALID_SHIPPING.fullName)
  await page.getByLabel('Dirección').fill(VALID_SHIPPING.address)
  await page.getByLabel('Ciudad').fill(VALID_SHIPPING.city)
  await page.getByLabel('Código postal').fill(postalCode)
}

When('relleno el envío con datos válidos', async ({ page }) => {
  await fillShipping(page, VALID_SHIPPING.postalCode)
})

When('relleno el envío con el código postal {string}', async ({ page }, postalCode: string) => {
  await fillShipping(page, postalCode)
})

When('pago en la página con la tarjeta {string}', async ({ page }, cardNumber: string) => {
  await page.getByLabel('Número de tarjeta').fill(cardNumber)
  await page.getByLabel('Caducidad (MM/AA)').fill(VALID_CARD.expiry)
  await page.getByLabel('CVC').fill(VALID_CARD.cvc)
  await page.getByRole('button', { name: /^Pagar/ }).click()
})

Then('veo el agradecimiento del pedido', async ({ page }) => {
  await expect(page.getByTestId('order-thanks')).toContainText('Gracias por tu pedido')
})

Then('el pedido muestra la tarjeta {string}', async ({ page }, masked: string) => {
  await expect(page.getByTestId('order-card')).toContainText(masked)
})

Then('el campo {string} explica {string}', async ({ page }, field: string, message: string) => {
  await expect(page.getByTestId(`error-${field}`)).toHaveText(message)
})

// Orders
Given('ha comprado {string}', async ({ page, world }, content: string) => {
  world.orders.push(await buy(page.request, content))
})

Given('otro cliente ha hecho un pedido de {string}', async ({ browser, world }, content: string) => {
  const request = await otherCustomer(browser)
  world.other = { request, orderNumber: await buy(request, content) }
})

When('pido por la API el detalle de mi último pedido', async ({ page, world }) => {
  world.api = await api(page.request, 'getOrder', 'GET', `/api/orders/${world.orders.at(-1)}`)
})

When('pido por la API el pedido del otro cliente', async ({ page, world }) => {
  world.api = await api(page.request, 'getOrder', 'GET', `/api/orders/${world.other!.orderNumber}`)
})

Then('tengo {int} pedidos, el más reciente primero', async ({ world }, count: number) => {
  const numbers = (world.api!.body as { number: string }[]).map((o) => o.number)
  expect(numbers).toHaveLength(count)
  expect(numbers).toEqual([...world.orders].reverse())
})

Then('la respuesta es idéntica a la de un pedido inexistente', async ({ page, world }) => {
  const missing = await api(page.request, 'getOrder', 'GET', '/api/orders/TC-999999')
  const own = world.api!.body as { error: string }
  expect(missing.status).toBe(world.api!.status)
  expect(own.error.replace(world.other!.orderNumber!, 'X')).toBe((missing.body as { error: string }).error.replace('TC-999999', 'X'))
  expect(Object.keys(own).sort()).toEqual(Object.keys(missing.body as object).sort())
})

Then('no aparece el pedido del otro cliente', async ({ world }) => {
  expect((world.api!.body as { number: string }[]).map((o) => o.number)).not.toContain(world.other!.orderNumber)
})

// Contract sweep (QA-047)
When('recorro las operaciones de lectura públicas del contrato', async ({ request, world, contract }) => {
  const doc = await (await request.get('/api/openapi.json')).json()
  world.sweep = []
  for (const op of sweepableOperations(doc)) {
    const res = await request.get(op.path)
    world.sweep.push({ operationId: op.operationId, status: res.status(), errors: contract.validate(op.operationId, res.status(), await res.json()) })
  }
})

Then('todas responden 200 y cumplen su esquema publicado', async ({ world }) => {
  for (const r of world.sweep!) {
    expect(r.status, r.operationId).toBe(200)
    expect(r.errors, r.operationId).toEqual([])
  }
})

Then('el barrido ha cubierto al menos {int} operaciones', async ({ world }, count: number) => {
  expect(world.sweep!.length).toBeGreaterThanOrEqual(count)
})
