// Steps for QAL-006: accessibility (axe), keyboard use and visual regression.
import { existsSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import { VISUAL_DIR, visualBaseline } from '../support/visual'
import { Then, When } from './fixtures'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

Then('la página no tiene violaciones de accesibilidad graves ni críticas', async ({ page }) => {
  const result = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  const serious = result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${new URL(page.url()).pathname}: ${v.id} [${v.impact}] en ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
  expect(serious, 'violaciones WCAG 2.1 AA graves o críticas').toEqual([])
})

When('llego con el tabulador al botón {string}', async ({ page }, name: string) => {
  const target = page.getByRole('button', { name })
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((el) => el === document.activeElement)) return
  }
  throw new Error(`El tabulador no llega a "${name}" en 40 pulsaciones`)
})

Then('el elemento con el foco tiene un indicador visible', async ({ page }) => {
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const s = getComputedStyle(el)
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
  })
  expect(outline.style).not.toBe('none')
  expect(outline.width).toBeGreaterThan(0)
})

When('pulso Intro', async ({ page }) => {
  await page.keyboard.press('Enter')
})

Then('veo el aviso de que se ha añadido al carrito', async ({ page }) => {
  await expect(page.getByTestId('cart-message')).toHaveText('Añadido al carrito')
})

When('abro {string} para compararla', async ({ page }, url: string) => {
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
})

Then('la página coincide con la referencia {string}', async ({ page, $testInfo }, name: string) => {
  const baseline = visualBaseline(name)
  // Without an approved baseline for this OS the comparison is skipped with the reason, never passed (EXP-003).
  if (!existsSync(baseline) && process.env.QA_UPDATE_SNAPSHOTS !== '1') {
    $testInfo.skip(
      true,
      `Sin referencia visual para ${process.platform} (${path.join(VISUAL_DIR, path.basename(baseline))}). ` +
        'Genérala con el workflow "Referencias visuales" e incorpórala por PR.',
    )
  }
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, maxDiffPixelRatio: 0.01, animations: 'disabled' })
})
