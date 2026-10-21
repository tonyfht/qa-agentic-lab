// Steps for QAL-007: security headers, sensitive forms, third parties and declared cookies (SEC-001, SEC-005, SEC-006, CMP-003).
import { expect } from '@playwright/test'
import { Then, When } from './fixtures'

const EXPECTED: Record<string, RegExp> = {
  'content-security-policy': /frame-ancestors 'none'/,
  'x-content-type-options': /^nosniff$/,
  'x-frame-options': /^DENY$/,
  'referrer-policy': /^strict-origin-when-cross-origin$/,
  'permissions-policy': /camera=\(\).*microphone=\(\).*geolocation=\(\)/,
  'cross-origin-opener-policy': /^same-origin$/,
  'cross-origin-resource-policy': /^same-origin$/,
  'cross-origin-embedder-policy': /^require-corp$/,
}

When('pido la portada sin navegador', async ({ request, world }) => {
  const res = await request.get('/')
  world.headers = res.headers()
})

Then('la respuesta tiene las cabeceras de seguridad', async ({ world }) => {
  for (const [name, value] of Object.entries(EXPECTED)) expect(world.headers?.[name], name).toMatch(value)
  expect(world.headers?.['x-powered-by'], 'no se anuncia la tecnología').toBeUndefined()
})

Then('la respuesta de la API tiene {string} con {string}', async ({ request }, header: string, value: string) => {
  const res = await request.get('/api/products?page=1')
  expect(res.headers()[header.toLowerCase()]).toBe(value)
  expect(res.headers()['content-security-policy']).toBeDefined()
})

When('recorro la portada, el catálogo, una ficha y el carrito', async ({ page, world }) => {
  page.on('request', (r) => world.requests.push(r.url()))
  for (const url of ['/', '/catalogo', '/producto/manta-punto-gruesa', '/carrito']) {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
  }
})

Then('todas las peticiones del navegador van a la propia tienda', async ({ world, baseURL }) => {
  const origin = new URL(baseURL!).origin
  expect(world.requests.length).toBeGreaterThan(0)
  expect(world.requests.filter((u) => !u.startsWith(origin) && !u.startsWith('data:'))).toEqual([])
})

Then('la tabla de cookies describe {string} y {string} como necesarias', async ({ page }, a: string, b: string) => {
  const table = page.getByRole('table', { name: 'Cookies que usa la tienda' })
  for (const name of [a, b]) {
    await expect(table.getByRole('row').filter({ hasText: name })).toContainText('Necesaria')
  }
  await expect(table.getByRole('row')).toHaveCount(3)
})

Then('el formulario {string} se envía por POST', async ({ page }, name: string) => {
  // Without method="post" a submit before hydration would put credentials or card data in the URL (SEC-005).
  await expect(page.getByRole('form', { name })).toHaveAttribute('method', 'post')
})

// SEC-006: the same write, once from a foreign site and once from the store itself (Origin = baseURL).
When('añado al carrito por la API desde el origen {string}', async ({ request, world }, origin: string) => {
  const res = await request.post('/api/cart/items', { headers: { Origin: origin }, data: { slug: 'taza-desayuno-xl', quantity: 1 } })
  world.api = { operationId: 'addCartItem', status: res.status(), body: await res.json() }
})

When('añado al carrito por la API desde el origen de la tienda', async ({ request, world, baseURL }) => {
  const res = await request.post('/api/cart/items', { headers: { Origin: new URL(baseURL!).origin }, data: { slug: 'taza-desayuno-xl', quantity: 1 } })
  world.api = { operationId: 'addCartItem', status: res.status(), body: await res.json() }
})
