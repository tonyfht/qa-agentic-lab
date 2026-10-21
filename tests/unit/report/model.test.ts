import { describe, expect, it } from 'vitest'
import { buildModel, displayTitle, formatDuration, requirementStatus, runLabel, testKind } from '@/report/model'
import type { TestResult } from '@/qa/results/schema'
import { sampleRun } from '@/tests/support/sample-runs'

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
    expect(passed).toMatchObject({ value: '2 / 2', delta: '▲ 1 tests superados más que la ejecución anterior', trend: 'better' })
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

describe('QA-014 Indicadores legibles', () => {
  it('una duración menor se lee como mejora y con "menos"', () => {
    const prev = sampleRun({ runId: 'a', startedAt: '2026-10-21T10:00:00.000Z', finishedAt: '2026-10-21T10:01:40.000Z' })
    const curr = sampleRun({ runId: 'b', startedAt: '2026-10-21T11:00:00.000Z', finishedAt: '2026-10-21T11:01:36.000Z' })
    expect(buildModel([prev, curr], () => false).kpis[3]).toMatchObject({
      delta: '▼ 4 s menos que la ejecución anterior',
      trend: 'better',
    })
  })
})

describe('QA-011 Tipo de prueba en la trazabilidad', () => {
  it('reconoce E2E, API, unitaria, arranque, estática y gobierno por sus etiquetas', () => {
    const kind = (tags: string[]) => testKind({ ...sampleRun().tests[0], tags })
    expect(kind(['@CAT-004', '@api'])).toBe('API')
    expect(kind(['@e2e', '@api'])).toBe('E2E')
    expect(kind(['@unit'])).toBe('unitaria')
    expect(kind(['@static'])).toBe('estática')
    expect(kind(['@build'])).toBe('arranque')
    expect(kind([])).toBe('otra')
  })
})

describe('QA-017 Qué ha hecho la IA', () => {
  it('cuenta las actuaciones por agente (también los que no tienen) y ordena las últimas', () => {
    const base = { change: 'QAL-003', artifacts: [], executedBy: 'x', action: 'a', summary: 's' }
    const run = sampleRun({
      agentActions: [
        { ...base, date: '2026-10-20T10:00:00.000Z', agent: 'analista' },
        { ...base, date: '2026-10-21T10:00:00.000Z', agent: 'analista' },
        { ...base, date: '2026-10-19T10:00:00.000Z', agent: 'disenador' },
      ],
    })
    const { agents } = buildModel([run], () => false)
    expect(agents.byAgent.map((a) => [a.id, a.count])).toEqual([
      ['revisor-specs', 0],
      ['analista', 2],
      ['disenador', 1],
      ['automatizador', 0],
      ['api', 0],
      ['auditor-experiencia', 0],
      ['auditor-seguridad', 0],
    ])
    expect(agents.latest.map((a) => a.date.slice(0, 10))).toEqual(['2026-10-21', '2026-10-20', '2026-10-19'])
    expect(agents.latest[0].agent).toBe('Analista')
  })
})

describe('QA-018 Es usable y rápida', () => {
  it('resume Lighthouse, carga, su evolución y la accesibilidad de la última ejecución', () => {
    const lh = { page: '/', performance: 90, accessibility: 100, bestPractices: 96, seo: 100, lcpMs: 400, cls: 0, tbtMs: 0 }
    const prev = sampleRun({ runId: 'a', origin: { kind: 'ci', runNumber: 1 }, metrics: {} })
    const curr = sampleRun({
      runId: 'b',
      origin: { kind: 'ci', runNumber: 2 },
      metrics: { lighthouse: [lh, { ...lh, page: '/catalogo', performance: 100 }], load: { p95Ms: 120, errorRate: 0, requests: 10, vus: 20, durationS: 30 } },
      tests: [{ ...sampleRun().tests[0], title: 'Accesibilidad › portada', tags: ['@a11y'], status: 'passed' }],
    })
    const { experience } = buildModel([prev, curr], () => false)
    expect(experience.lighthouse).toHaveLength(2)
    expect(experience.load?.p95Ms).toBe(120)
    expect(experience.trend).toEqual([
      { label: '#1', performance: null, p95Ms: null },
      { label: '#2', performance: 95, p95Ms: 120 },
    ])
    expect(experience.a11y).toEqual([{ title: 'Accesibilidad › portada', status: 'passed' }])
  })

  it('sin métricas no inventa datos', () => {
    const { experience } = buildModel([sampleRun()], () => false)
    expect(experience).toMatchObject({ lighthouse: [], load: null, a11y: [] })
  })
})

describe('QA-026 Es segura y cumple', () => {
  it('cuenta hallazgos por fuente y gravedad, separa producción y lista las excepciones', () => {
    const run = sampleRun({
      stages: [{ id: 'security', name: 'Seguridad y cumplimiento', blocking: true, status: 'passed', durationMs: 1 }],
      findings: [
        { source: 'zap', severity: 'medium', title: 'CSP', accepted: 'motivo' },
        { source: 'npm-audit', severity: 'high', title: 'braces', scope: 'development' },
        { source: 'semgrep', severity: 'low', title: 'x' },
      ],
      metrics: { sbom: { components: 42 }, licenses: { packages: 42 } },
    })
    const { security } = buildModel([run], () => false)
    expect(security).toMatchObject({ ran: true, blocking: 0, sbomComponents: 42, licensedPackages: 42 })
    expect(security.bySource.zap.medium).toBe(1)
    expect(security.production.high).toBe(0)
    expect(security.accepted).toEqual([{ title: 'CSP', source: 'zap', reason: 'motivo' }])
  })

  it('sin la etapa no se da por ejecutada', () => {
    expect(buildModel([sampleRun()], () => false).security.ran).toBe(false)
  })
})
