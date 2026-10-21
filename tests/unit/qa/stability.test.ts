import { describe, expect, it } from 'vitest'
import type { RunResult, TestResult } from '@/qa/results/schema'
import { stability } from '@/qa/stability/stability'

const test = (title: string, status: TestResult['status']): TestResult => ({
  id: title,
  title,
  file: 'tests/features/x.feature',
  stage: 'e2e',
  status,
  durationMs: 1,
  retries: status === 'flaky' ? 1 : 0,
  requirements: [],
  tags: [],
})

const run = (i: number, tests: TestResult[]) =>
  ({ runId: `r${i}`, startedAt: `2026-10-${String(i).padStart(2, '0')}T10:00:00.000Z`, tests }) as RunResult

describe('QA-051 Detector de inestables', () => {
  const history = Array.from({ length: 10 }, (_, i) =>
    run(i + 1, [test('carrito', i === 3 || i === 7 ? 'flaky' : 'passed'), test('portada', 'passed'), test('visual', 'skipped')]),
  )

  it('un test inestable en 2 de 10 ejecuciones aparece con un 20 % y su última fecha', () => {
    const { unstable } = stability(history)
    expect(unstable).toEqual([
      { title: 'carrito', file: 'tests/features/x.feature', runs: 10, flaky: 2, rate: 0.2, lastFlakyAt: '2026-10-08T10:00:00.000Z' },
    ])
  })

  it('un test que siempre pasa a la primera no aparece', () => {
    expect(stability(history).unstable.map((t) => t.title)).not.toContain('portada')
  })

  it('la tasa de cada ejecución cuenta solo los tests ejecutados, no los omitidos', () => {
    const { runs } = stability(history)
    expect(runs[3]).toMatchObject({ runId: 'r4', executed: 2, flaky: 1, rate: 0.5 })
    expect(runs[0].rate).toBe(0)
  })

  it('solo mira la ventana de las últimas ejecuciones', () => {
    const { runs, unstable } = stability(history, 2)
    expect(runs.map((r) => r.runId)).toEqual(['r9', 'r10'])
    expect(unstable).toEqual([])
  })
})
