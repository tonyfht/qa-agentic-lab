import { expect } from '@playwright/test'
import { Then, When } from './fixtures'

When('consulto el estado de salud de la API', async ({ request, world }) => {
  const res = await request.get('/api/health')
  world.healthResponse = { status: res.status(), body: await res.json() }
})

Then('la respuesta es correcta', async ({ world }) => {
  expect(world.healthResponse?.status).toBe(200)
  expect(world.healthResponse?.body.status).toBe('ok')
})

Then('indica la versión de la aplicación', async ({ world }) => {
  expect(world.healthResponse?.body.version).toMatch(/^\d+\.\d+\.\d+/)
})

When('abro la portada de la tienda', async ({ page }) => {
  await page.goto('/')
})

Then('veo el nombre {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
})
