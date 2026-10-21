import { expect } from '@playwright/test'
import { Then, When, type ApiCall } from './fixtures'

type ProductList = {
  items: { slug: string; name: string; category: string; priceCents: number; stock: number; rating: number }[]
  total: number
}

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
  // Prices carry a non-breaking space before "€"; the Gherkin text uses a normal one.
  const text = [body.error, ...(body.details ?? [])].join('\n').replace(/\s/g, ' ')
  expect(text).toContain(reason.replace(/\s/g, ' '))
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

// Generic oracle for any combination of catalogue parameters (written by the Automatizador agent, QAL-003).
Then('todos los artículos cumplen los filtros {string}', async ({ world }, query: string) => {
  const p = new URLSearchParams(query)
  const items = (world.api!.body as ProductList).items
  const cents = (v: string | null) => (v === null ? null : Math.round(Number(v.replace(',', '.')) * 100))
  const min = cents(p.get('minPrice'))
  const max = cents(p.get('maxPrice'))
  for (const item of items) {
    if (p.get('category')) expect(item.category, item.slug).toBe(p.get('category'))
    if (min !== null) expect(item.priceCents, item.slug).toBeGreaterThanOrEqual(min)
    if (max !== null) expect(item.priceCents, item.slug).toBeLessThanOrEqual(max)
    if (p.get('inStock')) expect(item.stock, item.slug).toBeGreaterThan(0)
  }
  const sorted = (key: (a: (typeof items)[0], b: (typeof items)[0]) => number) => [...items].sort(key).map((i) => i.slug)
  const order: Record<string, string[]> = {
    'price-asc': sorted((a, b) => a.priceCents - b.priceCents || a.name.localeCompare(b.name, 'es')),
    name: sorted((a, b) => a.name.localeCompare(b.name, 'es')),
    rating: sorted((a, b) => b.rating - a.rating || a.name.localeCompare(b.name, 'es')),
  }
  const sort = p.get('sort')
  if (sort && order[sort]) expect(items.map((i) => i.slug)).toEqual(order[sort])
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
