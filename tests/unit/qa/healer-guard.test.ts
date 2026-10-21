import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { assertionTail, checkHealerDiff, HEALER_MARKER } from '@/qa/healer/guard'

const diff = (file: string, removed: string[], added: string[]) =>
  [
    `diff --git a/${file} b/${file}`,
    'index 1111111..2222222 100644',
    `--- a/${file}`,
    `+++ b/${file}`,
    '@@ -1,3 +1,3 @@',
    ...removed.map((l) => `-${l}`),
    ...added.map((l) => `+${l}`),
  ].join('\n')

describe('QA-050 Sanador con guardia de aserciones', () => {
  it('acepta cambiar el localizador dentro de expect(...)', () => {
    const d = diff(
      'tests/steps/catalog.steps.ts',
      ["  await expect(page.getByTestId('results-total')).toHaveText(text)"],
      ["  await expect(page.getByTestId('results-count')).toHaveText(text)"],
    )
    expect(checkHealerDiff(d)).toEqual([])
  })

  it('acepta añadir una espera antes de la aserción', () => {
    const d = diff(
      'tests/steps/cart.steps.ts',
      ["  await expect(page.getByTestId('cart-message')).toHaveText('Añadido al carrito')"],
      ["  await page.getByTestId('cart-message').waitFor()", "  await expect(page.getByTestId('cart-message')).toHaveText('Añadido al carrito')"],
    )
    expect(checkHealerDiff(d)).toEqual([])
  })

  it('rechaza cambiar el valor esperado, nombrando el fichero y la aserción', () => {
    const d = diff(
      'tests/steps/catalog.steps.ts',
      ["  await expect(page.getByTestId('results-total')).toHaveText('5 artículos')"],
      ["  await expect(page.getByTestId('results-total')).toHaveText('6 artículos')"],
    )
    const [error] = checkHealerDiff(d)
    expect(error).toMatch(/^tests\/steps\/catalog\.steps\.ts: cambia o elimina la aserción/)
    expect(error).toContain("toHaveText('5 artículos')")
  })

  it('rechaza cambiar el comparador o eliminar la aserción', () => {
    expect(checkHealerDiff(diff('tests/steps/a.steps.ts', ['  expect(res.status()).toBe(200)'], ['  expect(res.status()).toBeLessThan(500)']))).toHaveLength(1)
    expect(checkHealerDiff(diff('tests/steps/a.steps.ts', ['  expect(res.status()).toBe(200)'], []))).toHaveLength(1)
  })

  it('rechaza tocar la tienda, una especificación o un escenario', () => {
    for (const file of ['app/catalogo/page.tsx', 'tests/features/catalog/filtros.feature', 'openspec/specs/catalog/spec.md', 'playwright.config.ts']) {
      expect(checkHealerDiff(diff(file, ['a'], ['b']))[0]).toBe(`${file}: el Sanador solo puede tocar tests/steps/ y tests/support/`)
    }
  })

  it('la cola de una aserción ignora paréntesis dentro de cadenas', () => {
    expect(assertionTail("await expect(page.getByText('Total (IVA incl.)')).toBeVisible()")).toBe('.toBeVisible()')
    expect(assertionTail('const x = 1')).toBeNull()
  })

  it('con el diff real de la reparación del defecto selector: el localizador pasa y relajar la aserción no', () => {
    const fixture = (name: string) => readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')
    expect(checkHealerDiff(fixture('sanador-selector.diff'))).toEqual([])
    expect(checkHealerDiff(fixture('sanador-asercion.diff'))).toEqual([
      "tests/steps/catalog.steps.ts: cambia o elimina la aserción «await expect(page.getByTestId('results-total')).toHaveText(text)»",
    ])
  })

  it('la guardia se activa con la línea "Agente: sanador" en el cuerpo del PR', () => {
    expect(HEALER_MARKER.test('## Qué cambia\n\nAgente: sanador\n')).toBe(true)
    expect(HEALER_MARKER.test('Lo revisará el sanador más adelante')).toBe(false)
  })
})
