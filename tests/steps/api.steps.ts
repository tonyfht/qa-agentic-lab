import { expect } from '@playwright/test'
import { Then, When, type ApiCall } from './fixtures'

type ProductList = { items: { slug: string; priceCents: number }[]; total: number }

const euros = (n: number) => String(n).replace('.', ',')

async function call(request: import('@playwright/test').APIRequestContext, operationId: string, url: string): Promise<ApiCall> {
  const res = await request.get(url)
  return { operationId, status: res.status(), body: await res.json() }
}

When('pido por la API los artículos con {string}', async ({ request, world }, query: string) => {
  world.api = await call(request, 'listProducts', `/api/products?${query}`)
})

When('pido por la API los artículos entre {float} y {float} euros', async ({ request, world }, min: number, max: number) => {
  world.api = await call(request, 'listProducts', `/api/products?minPrice=${euros(min)}&maxPrice=${euros(max)}`)
})

When('pido por la API el artículo {string}', async ({ request, world }, slug: string) => {
  world.api = await call(request, 'getProduct', `/api/products/${slug}`)
})

When('pido por la API las categorías', async ({ request, world }) => {
  world.api = await call(request, 'listCategories', '/api/categories')
})

Then('la API responde {int}', async ({ world }, status: number) => {
  expect(world.api?.status, JSON.stringify(world.api?.body)).toBe(status)
})

Then('la respuesta cumple el contrato publicado', async ({ world, contract }) => {
  const { operationId, status, body } = world.api!
  expect(contract.validate(operationId, status, body), `contrato de ${operationId} ${status}`).toEqual([])
})

Then('el error explica {string}', async ({ world }, reason: string) => {
  const body = world.api!.body as { error: string; details?: string[] }
  expect([body.error, ...(body.details ?? [])].join('\n')).toContain(reason)
})

Then('la respuesta tiene {int} artículos de un total de {int}', async ({ world }, count: number, total: number) => {
  const body = world.api!.body as ProductList
  expect(body.items).toHaveLength(count)
  expect(body.total).toBe(total)
})

Then('la respuesta tiene {int} artículos', async ({ world }, total: number) => {
  expect((world.api!.body as ProductList).total).toBe(total)
})

Then('la respuesta incluye el artículo {string}', async ({ world }, slug: string) => {
  expect((world.api!.body as ProductList).items.map((p) => p.slug)).toContain(slug)
})

Then('todos cuestan entre {float} y {float} euros', async ({ world }, min: number, max: number) => {
  for (const p of (world.api!.body as ProductList).items) {
    expect(p.priceCents).toBeGreaterThanOrEqual(Math.round(min * 100))
    expect(p.priceCents).toBeLessThanOrEqual(Math.round(max * 100))
  }
})

Then('cada artículo cuesta lo mismo o más que el anterior', async ({ world }) => {
  const prices = (world.api!.body as ProductList).items.map((p) => p.priceCents)
  expect(prices).toEqual([...prices].sort((a, b) => a - b))
})

When('busco en la interfaz y en la API con {string}', async ({ page, request, world }, query: string) => {
  await page.goto(`/catalogo?${query}`)
  world.api = await call(request, 'listProducts', `/api/products?${query}`)
})

Then('las dos listas tienen los mismos artículos en el mismo orden', async ({ page, world }) => {
  const ui = await page.getByTestId('product-card').evaluateAll((els) => els.map((e) => e.getAttribute('data-slug')))
  const api = (world.api!.body as ProductList).items.map((p) => p.slug)
  expect(ui.length).toBeGreaterThan(0)
  expect(ui).toEqual(api)
})
