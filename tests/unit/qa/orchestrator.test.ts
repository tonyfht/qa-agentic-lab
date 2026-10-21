import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  executePlan,
  partialFile,
  planStages,
  renderSummary,
  runFailed,
  UnknownStageError,
} from '@/qa/orchestrator'
import type { StageContext, StageDefinition, StageOutcome } from '@/qa/stages/types'

function stage(
  id: string,
  outcome: StageOutcome | (() => Promise<StageOutcome>),
  extra: Partial<StageDefinition> = {},
): StageDefinition & { calls: number } {
  const def = {
    id,
    name: id.toUpperCase(),
    blocking: true,
    dependsOn: [],
    calls: 0,
    async run() {
      def.calls += 1
      return typeof outcome === 'function' ? outcome() : outcome
    },
    ...extra,
  }
  return def
}

function ctx(): StageContext {
  const runDir = mkdtempSync(path.join(os.tmpdir(), 'qal-run-'))
  return { root: runDir, runId: 'test', runDir, options: {}, log: () => {} }
}

const ok: StageOutcome = { status: 'passed' }
const ko: StageOutcome = { status: 'failed', reason: 'boom' }

describe('QA-002 Etapas ejecutables en local', () => {
  const registry = [
    stage('static', ok),
    stage('build', ok),
    stage('e2e', ok, { dependsOn: ['build'] }),
    stage('report', ok, { blocking: false }),
    stage('governance', ok, { standalone: true }),
  ]

  it('sin etapa: todas las no independientes, en el orden del registro', () => {
    expect(planStages(registry).map((s) => s.id)).toEqual(['static', 'build', 'e2e', 'report'])
  })

  it('con etapa: solo esa y sus requisitos previos', () => {
    expect(planStages(registry, 'e2e').map((s) => s.id)).toEqual(['build', 'e2e'])
    expect(planStages(registry, 'governance').map((s) => s.id)).toEqual(['governance'])
  })

  it('etapa inexistente: error que lista las disponibles', () => {
    expect(() => planStages(registry, 'nope')).toThrow(UnknownStageError)
    expect(() => planStages(registry, 'nope')).toThrow(/static, build, e2e, report, governance/)
  })

  it('una dependencia ya satisfecha no se repite al pedir una sola etapa', async () => {
    const build = stage('build', ok, { isSatisfied: () => true })
    const e2e = stage('e2e', ok, { dependsOn: ['build'] })
    const partials = await executePlan([build, e2e], ctx(), 'e2e')
    expect(build.calls).toBe(0)
    expect(partials.map((p) => p.stage.status)).toEqual(['passed'])
  })
})

describe('QA-001 / QA-005 Semántica de fallos', () => {
  it('si la tienda no arranca, lo que la prueba queda como no ejecutado y el resto sigue', async () => {
    const build = stage('build', ko)
    const e2e = stage('e2e', ok, { dependsOn: ['build'] })
    const report = stage('report', ok, { blocking: false })
    const staticStage = stage('static', ok)
    const partials = await executePlan([staticStage, build, e2e, report], ctx())

    expect(partials.map((p) => [p.stage.id, p.stage.status])).toEqual([
      ['static', 'passed'],
      ['build', 'failed'],
      ['e2e', 'not_run'],
      ['report', 'passed'],
    ])
    expect(e2e.calls).toBe(0)
    expect(partials[2].stage.reason).toMatch(/BUILD/)
    expect(runFailed(partials.map((p) => p.stage))).toBe(true)
  })

  it('un error inesperado en una etapa se registra como fallo con su mensaje', async () => {
    const crash = stage('static', async () => {
      throw new Error('se rompió')
    })
    const [partial] = await executePlan([crash], ctx())
    expect(partial.stage).toMatchObject({ status: 'failed', reason: 'se rompió' })
  })

  it('una etapa no bloqueante fallida no pone la ejecución en rojo', () => {
    expect(
      runFailed([{ id: 'report', name: 'Informe', blocking: false, status: 'failed', durationMs: 1 }]),
    ).toBe(false)
  })

  it('cada etapa deja su resultado parcial en disco', async () => {
    const c = ctx()
    await executePlan([stage('static', ok)], c)
    const file = partialFile(c.runDir, 'static')
    expect(existsSync(file)).toBe(true)
    expect(JSON.parse(readFileSync(file, 'utf8')).stage.status).toBe('passed')
  })
})

describe('QA-007 Nada se omite en silencio', () => {
  it('una etapa sin su requisito consta como omitida con el motivo y no se ejecuta', async () => {
    const needsSecret = stage('agents', ok, { missingRequirement: () => 'falta ANTHROPIC_API_KEY' })
    const [partial] = await executePlan([needsSecret], ctx())
    expect(needsSecret.calls).toBe(0)
    expect(partial.stage).toMatchObject({ status: 'skipped', reason: 'falta ANTHROPIC_API_KEY' })
  })

  it('una dependencia omitida impide ejecutar a quien depende de ella', async () => {
    const skipped = stage('build', ok, { missingRequirement: () => 'sin Docker' })
    const e2e = stage('e2e', ok, { dependsOn: ['build'] })
    const partials = await executePlan([skipped, e2e], ctx())
    expect(partials[1].stage.status).toBe('not_run')
  })
})

describe('QA-006 Resumen legible de cada ejecución', () => {
  const stages = [
    { id: 'static', name: 'Análisis estático', blocking: true, status: 'passed' as const, durationMs: 38_000 },
    { id: 'e2e', name: 'Smoke y E2E', blocking: true, status: 'not_run' as const, durationMs: 0, reason: 'x' },
    { id: 'report', name: 'Informe', blocking: false, status: 'passed' as const, durationMs: 900 },
  ]
  const summary = renderSummary(stages, [{ status: 'passed' }, { status: 'flaky' }], 'reports/site/index.html')

  it('incluye una fila por etapa con estado y duración', () => {
    expect(summary).toContain('| Análisis estático | ✅ Superada | 38 s |')
    expect(summary).toContain('| Smoke y E2E | ⛔ No ejecutada | 0 ms | x |')
    expect(summary).toContain('| Informe (no bloqueante) | ✅ Superada | 900 ms |')
  })

  it('incluye el recuento de tests y el enlace al informe', () => {
    expect(summary).toContain('1 superados · 0 fallidos · 1 inestables · 0 omitidos')
    expect(summary).toContain('📊 Informe: reports/site/index.html')
  })
})

describe('QA-019 Etapa de rendimiento y carga', () => {
  it('es bloqueante, depende de la tienda y va después del E2E y antes del informe', async () => {
    const { registry } = await import('@/qa/stages/registry')
    const ids = registry.map((s) => s.id)
    const perf = registry.find((s) => s.id === 'performance')!
    expect(perf).toMatchObject({ name: 'Rendimiento y carga', blocking: true, dependsOn: ['build'] })
    expect(ids.indexOf('performance')).toBe(ids.indexOf('e2e') + 1)
    expect(ids.indexOf('security')).toBe(ids.indexOf('performance') + 1)
  })
})
