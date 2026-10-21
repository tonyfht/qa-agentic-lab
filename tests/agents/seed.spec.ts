// Seed for the Playwright Test Agents (planner, generator, healer) and for the Analista agent:
// it leaves the browser on the store's home page, ready to explore. Not part of the pipeline.
import { expect, test } from '@playwright/test'

test('seed', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('La Tienda en Casa')
})
