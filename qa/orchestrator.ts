import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { StageResult } from './results/schema'
import type { StageContext, StageDefinition, StagePartial } from './stages/types'

export class UnknownStageError extends Error {
  constructor(id: string, available: string[]) {
    super(`La etapa "${id}" no existe. Etapas disponibles: ${available.join(', ')}`)
    this.name = 'UnknownStageError'
  }
}

/**
 * Stages to run, in registry order. Without a target: every non-standalone stage.
 * With a target: the target plus its transitive dependencies (QA-002).
 */
export function planStages(registry: StageDefinition[], target?: string): StageDefinition[] {
  if (!target) return registry.filter((s) => !s.standalone)
  const byId = new Map(registry.map((s) => [s.id, s]))
  if (!byId.has(target)) throw new UnknownStageError(target, registry.map((s) => s.id))

  const needed = new Set<string>()
  const visit = (id: string) => {
    if (needed.has(id)) return
    needed.add(id)
    byId.get(id)!.dependsOn.forEach(visit)
  }
  visit(target)
  return registry.filter((s) => needed.has(s.id))
}

export function partialFile(runDir: string, stageId: string): string {
  return path.join(runDir, 'stages', `${stageId}.json`)
}

function writePartial(runDir: string, partial: StagePartial) {
  const file = partialFile(runDir, partial.stage.id)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(partial, null, 2))
}

/**
 * Runs the plan. A failed blocking stage turns the run red, but stages that do not depend on it still run
 * so the report shows the whole picture (QA-005). Dependants of a stage that did not complete are recorded
 * as not_run, never as passed (QA-001). A stage that cannot run here is recorded as skipped with its reason (QA-007).
 */
export async function executePlan(
  plan: StageDefinition[],
  ctx: StageContext,
  target?: string,
): Promise<StagePartial[]> {
  const results = new Map<string, StageResult>()
  const partials: StagePartial[] = []

  for (const stage of plan) {
    if (target && stage.id !== target && stage.isSatisfied?.(ctx)) {
      ctx.log(`↷ ${stage.name}: ya disponible, no se repite`)
      results.set(stage.id, { id: stage.id, name: stage.name, blocking: stage.blocking, status: 'passed', durationMs: 0 })
      continue
    }

    const base = { id: stage.id, name: stage.name, blocking: stage.blocking }
    const brokenDep = stage.dependsOn
      .map((id) => results.get(id))
      .find((r) => r && r.status !== 'passed')
    let partial: StagePartial

    if (brokenDep) {
      partial = {
        stage: { ...base, status: 'not_run', durationMs: 0, reason: `Depende de "${brokenDep.name}", que no se completó` },
        tests: [],
      }
    } else {
      const missing = stage.missingRequirement?.(ctx) ?? null
      if (missing) {
        partial = { stage: { ...base, status: 'skipped', durationMs: 0, reason: missing }, tests: [] }
      } else {
        ctx.log(`▶ ${stage.name}`)
        const started = Date.now()
        try {
          const outcome = await stage.run(ctx)
          partial = {
            stage: { ...base, status: outcome.status, durationMs: Date.now() - started, reason: outcome.reason },
            tests: outcome.tests ?? [],
          }
        } catch (error) {
          partial = {
            stage: { ...base, status: 'failed', durationMs: Date.now() - started, reason: (error as Error).message },
            tests: [],
          }
        }
      }
    }

    results.set(stage.id, partial.stage)
    partials.push(partial)
    writePartial(ctx.runDir, partial)
  }

  return partials
}

export function runFailed(stages: StageResult[]): boolean {
  return stages.some((s) => s.blocking && s.status === 'failed')
}

const ICON: Record<StageResult['status'], string> = {
  passed: '✅ Superada',
  failed: '❌ Fallida',
  skipped: '⏭️ Omitida',
  not_run: '⛔ No ejecutada',
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`
}

/** Same Markdown for the console and for the GitHub run page (QA-006). */
export function renderSummary(
  stages: StageResult[],
  tests: { status: string }[],
  reportLink: string,
): string {
  const count = (status: string) => tests.filter((t) => t.status === status).length
  const lines = [
    `## ${runFailed(stages) ? '❌ Ejecución fallida' : '✅ Ejecución superada'}`,
    '',
    '| Etapa | Estado | Duración | Nota |',
    '|:--|:--|--:|:--|',
    ...stages.map(
      (s) =>
        `| ${s.name}${s.blocking ? '' : ' (no bloqueante)'} | ${ICON[s.status]} | ${formatDuration(s.durationMs)} | ${s.reason ?? ''} |`,
    ),
    '',
    `**Tests:** ${count('passed')} superados · ${count('failed')} fallidos · ${count('flaky')} inestables · ${count('skipped')} omitidos`,
    '',
    `📊 Informe: ${reportLink}`,
  ]
  return lines.join('\n') + '\n'
}
