import { describe, expect, it } from 'vitest'
import type { RunResult, TestResult } from '@/qa/results/schema'
import { releaseVerdict, verdictMarkdown } from '@/report/verdict'
import { sampleRun } from '../../support/sample-runs'

const test = (id: string, status: TestResult['status'], requirements = ['QA-001']): TestResult => ({
  id,
  title: `Test ${id}`,
  file: 'f',
  stage: 'e2e',
  status,
  durationMs: 1,
  retries: 0,
  requirements,
  tags: [],
})

const green = (overrides: Partial<RunResult> = {}) =>
  sampleRun({
    stages: [{ id: 'e2e', name: 'Smoke y E2E', blocking: true, status: 'passed', durationMs: 1 }],
    tests: [test('a', 'passed')],
    ...overrides,
  })

const lighthouse = (performance: number) => ({ lighthouse: [{ page: '/', performance }] })

describe('QA-036 Podemos salir', () => {
  it('todo en verde, sin inestables y con todos los requisitos probados: sí, con lo que va bien como motivos', () => {
    const v = releaseVerdict([green()])
    expect(v.verdict).toBe('si')
    expect(v.title).toBe('Sí, se puede salir')
    expect(v.reasons.map((r) => r.text)).toEqual(['Todas las etapas bloqueantes en verde', 'Ningún test inestable', 'Todos los requisitos tienen pruebas (1)'])
  })

  it('un test inestable da reservas y el motivo lo nombra', () => {
    const v = releaseVerdict([green({ tests: [test('a', 'flaky')] })])
    expect(v.verdict).toBe('reservas')
    expect(v.reasons).toContainEqual({ kind: 'reservation', text: '1 test solo pasó al reintentar: «Test a»' })
  })

  it('un requisito que falla es no salir, y el motivo lo nombra', () => {
    const v = releaseVerdict([green({ tests: [test('a', 'failed', ['PROMO-001'])] })])
    expect(v.verdict).toBe('no')
    expect(v.reasons).toContainEqual({ kind: 'blocker', text: 'Falla el requisito PROMO-001' })
  })

  it('una etapa bloqueante fallida o sin ejecutar es no salir', () => {
    for (const status of ['failed', 'not_run'] as const) {
      const v = releaseVerdict([green({ stages: [{ id: 'security', name: 'Seguridad', blocking: true, status, durationMs: 0 }] })])
      expect(v.verdict).toBe('no')
    }
  })

  it('un hallazgo de seguridad bloqueante es no salir; uno aceptado no', () => {
    expect(releaseVerdict([green({ findings: [{ source: 'zap', severity: 'high', title: 'x' }] })]).verdict).toBe('no')
    expect(releaseVerdict([green({ findings: [{ source: 'zap', severity: 'high', title: 'x', accepted: 'motivo' }] })]).verdict).toBe('si')
  })

  it('una ejecución con defecto inyectado nunca recomienda salir', () => {
    const v = releaseVerdict([green({ injectedDefect: 'cupon' })])
    expect(v.verdict).toBe('no')
    expect(v.reasons[0]).toEqual({ kind: 'blocker', text: 'Ejecución de demostración con el defecto «cupon» inyectado' })
  })

  it('requisitos sin pruebas o menos cobertura que la anterior dan reservas', () => {
    const requirements = [
      { id: 'QA-001', title: 'a', capability: 'c', source: 's' },
      { id: 'QA-002', title: 'b', capability: 'c', source: 's' },
    ]
    const prev = green({ requirements, tests: [test('a', 'passed', ['QA-001', 'QA-002'])] })
    const curr = green({ requirements, tests: [test('a', 'passed', ['QA-001'])] })
    const v = releaseVerdict([prev, curr])
    expect(v.verdict).toBe('reservas')
    expect(v.reasons.filter((r) => r.kind === 'reservation').map((r) => r.text)).toEqual([
      '1 requisito sin pruebas: QA-002',
      'Cubre 1 requisito menos que la ejecución anterior',
    ])
  })

  it('el rendimiento solo da reservas si cae más de 5 puntos (el ruido de Lighthouse no cuenta)', () => {
    expect(releaseVerdict([green({ metrics: lighthouse(98) }), green({ metrics: lighthouse(94) })]).verdict).toBe('si')
    const v = releaseVerdict([green({ metrics: lighthouse(98) }), green({ metrics: lighthouse(90) })])
    expect(v.verdict).toBe('reservas')
    expect(v.reasons).toContainEqual({ kind: 'reservation', text: 'El rendimiento medio de Lighthouse baja de 98 a 90' })
  })

  it('un bloqueo gana a una reserva', () => {
    expect(releaseVerdict([green({ tests: [test('a', 'flaky'), test('b', 'failed')] })]).verdict).toBe('no')
  })
})

describe('QA-037 Resumen ejecutivo', () => {
  it('el resumen del job lleva el veredicto, sus motivos y que es una recomendación', () => {
    const md = verdictMarkdown(releaseVerdict([green({ tests: [test('a', 'failed', ['PROMO-001'])] })]))
    expect(md).toMatch(/^## ¿Podemos salir\? ❌ No salir/)
    expect(md).toContain('- ✖ Falla el requisito PROMO-001')
    expect(md).toContain('la decisión de salir es de una persona')
  })
})
