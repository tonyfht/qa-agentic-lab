import { describe, expect, it } from 'vitest'
import type { RunResult, TestResult } from '@/qa/results/schema'
import { classifyFailure, withTriage } from '@/qa/triage/classify'
import { triageMarkdown } from '@/qa/triage/report'

// Real messages, captured with `npm run qa -- --stage e2e --inject <defecto>` and from CI and local runs (2026-10-21).
const MESSAGES = {
  cupon:
    'Error: {"error":"El cupón BIENVENIDA10 no existe"}\n\nexpect(received).toBe(expected) // Object.is equality\n\nExpected: 200\nReceived: 400',
  selector:
    'Error: expect(locator).toHaveText(expected) failed\n\nLocator: getByTestId(\'results-total\')\nExpected: "5 artículos"\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n  - Expect "toHaveText" getByTestId(\'results-total\') with timeout 5000ms',
  caida: 'Error: {"error":"Servicio no disponible"}\n\nexpect(received).toBe(expected) // Object.is equality\n\nExpected: 200\nReceived: 503',
  caidaStep: "TypeError: Cannot read properties of undefined (reading 'map')",
  teardown: 'Tearing down "context" exceeded the test timeout of 30000ms.',
  lighthouse:
    'Lighthouse falló:\nRuntime error encountered: Something went wrong with recording the trace over your page load. Please run Lighthouse again. (NO_NAVSTART)',
}

const failed = (message: string) => classifyFailure({ status: 'failed', message })

describe('QA-052 Triaje de fallos', () => {
  it('un valor recibido distinto del esperado es un defecto del producto (defecto cupon)', () => {
    expect(failed(MESSAGES.cupon)).toEqual({ category: 'producto', reason: 'La tienda no devuelve lo que dice la spec' })
  })

  it('un elemento que no existe es un fallo del test, para el Sanador (defecto selector)', () => {
    expect(failed(MESSAGES.selector).category).toBe('test')
    expect(failed(MESSAGES.selector).reason).toMatch(/Sanador/)
  })

  it('un 5xx es del entorno aunque traiga Expected/Received (defecto caida)', () => {
    expect(failed(MESSAGES.caida).category).toBe('entorno')
    expect(failed('Error: connect ECONNREFUSED 127.0.0.1:3410').category).toBe('entorno')
  })

  it('el navegador que no se cierra y el error de traza de Lighthouse son del entorno', () => {
    expect(failed(MESSAGES.teardown).category).toBe('entorno')
    expect(failed(MESSAGES.lighthouse).category).toBe('entorno')
  })

  it('pasar al reintentar es inestable, diga lo que diga el mensaje', () => {
    expect(classifyFailure({ status: 'flaky', message: MESSAGES.cupon }).category).toBe('inestable')
  })

  it('sin regla que aplique, es desconocido y queda para el agente (un step que rompe con la API caída)', () => {
    expect(failed(MESSAGES.caidaStep)).toEqual({
      category: 'desconocido',
      reason: 'Ninguna regla aplica: queda para revisión del agente de Triaje',
    })
  })

  it('solo se clasifican los tests fallidos o inestables', () => {
    const base = { id: 'x', file: 'f', stage: 'e2e', durationMs: 1, retries: 0, requirements: [], tags: [] }
    const [ok, ko] = withTriage([
      { ...base, title: 'ok', status: 'passed' },
      { ...base, title: 'ko', status: 'failed', message: MESSAGES.cupon },
    ] as TestResult[])
    expect(ok.triage).toBeUndefined()
    expect(ko.triage?.category).toBe('producto')
  })

  it('el triaje en Markdown resume por categoría y deja un borrador de defecto por cada fallo de producto', () => {
    const base = { file: 'tests/features/cart/cupones-y-totales.feature', stage: 'e2e', durationMs: 1, retries: 0, tags: [] }
    const run = {
      runId: 'local-1',
      injectedDefect: 'cupon',
      git: { sha: 'abcdef1234', branch: 'main', dirty: false },
      tests: withTriage([
        { ...base, id: '1', title: 'Cupones › Un cupón válido descuenta', status: 'failed', requirements: ['PROMO-001'], message: MESSAGES.cupon },
        { ...base, id: '2', title: 'Catálogo › Filtrar', status: 'failed', requirements: ['CAT-003'], message: MESSAGES.selector },
      ] as TestResult[]),
    } as RunResult
    const md = triageMarkdown(run, 'https://example.test/informe')
    expect(md).toContain('defecto **cupon** inyectado')
    expect(md).toContain('| Defecto del producto | 1 |')
    expect(md).toContain('| Test roto | 1 |')
    expect(md).toContain('#### [Defecto] PROMO-001: Cupones › Un cupón válido descuenta')
    expect(md).toContain('- **Evidencia:** https://example.test/informe')
    expect(md).not.toContain('[Defecto] CAT-003')
  })
})
