import { describe, expect, it } from 'vitest'
import { buildModel, displayTitle, formatDuration, requirementStatus, runLabel } from '@/report/model'
import type { TestResult } from '@/qa/results/schema'
import { sampleRun } from '../qa/results/fixtures'

const test = (status: TestResult['status'], requirements = ['QA-001'], extra: Partial<TestResult> = {}): TestResult => ({
  id: `${status}-${Math.random()}`,
  title: `test ${status}`,
  file: 'x',
  stage: 'e2e',
  status,
  durationMs: 1,
  retries: 0,
  requirements,
  tags: ['@e2e'],
  ...extra,
})

const requirements = [
  { id: 'QA-001', title: 'Uno', capability: 'c', source: 's' },
  { id: 'QA-002', title: 'Dos', capability: 'c', source: 's' },
  { id: 'QA-003', title: 'Tres', capability: 'c', source: 's' },
]

describe('QA-014 Gráficos que responden una pregunta', () => {
  it('estado de un requisito: fallido gana a inestable, inestable a superado; sin pruebas si no hay', () => {
    expect(requirementStatus([test('passed'), test('failed'), test('flaky')])).toBe('failed')
    expect(requirementStatus([test('passed'), test('flaky')])).toBe('flaky')
    expect(requirementStatus([test('passed')])).toBe('passed')
    expect(requirementStatus([])).toBe('untested')
    expect(requirementStatus([test('skipped')])).toBe('untested')
  })

  it('cobertura: cuenta requisitos por estado, incluidos los que no tienen pruebas', () => {
    const run = sampleRun({ requirements, tests: [test('passed'), test('flaky', ['QA-002'])] })
    expect(buildModel([run], () => false).coverage).toEqual({ passed: 1, flaky: 1, failed: 0, untested: 1 })
  })

  it('indicadores: diferencia frente a la ejecución anterior con su sentido', () => {
    const prev = sampleRun({ runId: 'a', requirements, tests: [test('passed')] })
    const curr = sampleRun({ runId: 'b', requirements, tests: [test('passed'), test('passed', ['QA-002'])] })
    const [passed, covered] = buildModel([prev, curr], () => false).kpis
    expect(passed).toMatchObject({ value: '2 / 2', delta: '▲ 1 tests superados que la ejecución anterior', trend: 'better' })
    expect(covered).toMatchObject({ value: '2 / 3', trend: 'better' })
  })

  it('primera ejecución: sin comparación', () => {
    const [passed] = buildModel([sampleRun()], () => false).kpis
    expect(passed).toMatchObject({ delta: null, trend: null })
  })

  it('tests sin trazar: se cuentan y se listan', () => {
    const run = sampleRun({ tests: [test('passed', [])] })
    const model = buildModel([run], () => false)
    expect(model.kpis[2].value).toBe('1')
    expect(model.untraced).toHaveLength(1)
  })

  it('la tendencia declara el mínimo de ejecuciones para el estado vacío', () => {
    const model = buildModel([sampleRun()], () => false)
    expect(model.trend).toMatchObject({ minRuns: 2 })
    expect(model.trend.runs).toHaveLength(1)
  })

  it('un histórico vacío es un error explícito', () => {
    expect(() => buildModel([], () => false)).toThrow(/npm run qa/)
  })

  it('etiquetas y formatos legibles', () => {
    expect(runLabel(sampleRun({ origin: { kind: 'ci', runNumber: 12 } }))).toBe('#12')
    expect(runLabel(sampleRun({ startedAt: '2026-10-21T09:05:00.000Z' }))).toBe('21/10 09:05')
    expect(formatDuration(252_000)).toBe('4 min 12 s')
    expect(displayTitle('QA-012 Histórico acumulado › añade un registro')).toBe('añade un registro')
    expect(displayTitle('La tienda arranca › Escenario')).toBe('La tienda arranca › Escenario')
  })
})

describe('QA-016 Detalle técnico enlazado', () => {
  const failing = test('failed', ['QA-001'], { detail: { kind: 'playwright-report', path: 'playwright-report/index.html#?testId=abc' } })

  it('enlaza al informe de Playwright publicado de esa ejecución', () => {
    const model = buildModel([sampleRun({ runId: 'r9', tests: [failing] })], () => true)
    expect(model.traceability[0].tests[0].detailHref).toBe('runs/r9/playwright/index.html#?testId=abc')
  })

  it('sin detalle publicado no hay enlace', () => {
    const model = buildModel([sampleRun({ runId: 'r9', tests: [failing] })], () => false)
    expect(model.traceability[0].tests[0].detailHref).toBeNull()
  })
})
