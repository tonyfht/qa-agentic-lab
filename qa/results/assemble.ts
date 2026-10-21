import { existsSync, readFileSync } from 'node:fs'
import { partialFile } from '../orchestrator'
import type { StageDefinition, StagePartial } from '../stages/types'
import { readAgentActions } from '../agents/registry'
import { withTriage } from '../triage/classify'
import { loadRequirementCatalog } from './requirements'
import { SCHEMA_VERSION, validateRunResult, type RunResult, type StageResult } from './schema'

export interface AssembleInput {
  root: string
  runId: string
  runDir: string
  registry: StageDefinition[]
  startedAt: string
  /** The report stage's own result, which has no partial on disk yet. */
  self: StageResult
  origin: RunResult['origin']
  git: RunResult['git']
  injectedDefect?: string | null
}

/**
 * Builds the run result from the partials each stage left on disk (locally or downloaded from other CI jobs).
 * A regular stage without a partial did not run in this run and is recorded as such, never omitted.
 */
export function assembleRun(input: AssembleInput): RunResult {
  const partials: StagePartial[] = []
  for (const stage of input.registry) {
    if (stage.id === input.self.id) continue
    const file = partialFile(input.runDir, stage.id)
    if (existsSync(file)) partials.push(JSON.parse(readFileSync(file, 'utf8')))
    else if (!stage.standalone) {
      partials.push({
        stage: {
          id: stage.id,
          name: stage.name,
          blocking: stage.blocking,
          status: 'not_run',
          durationMs: 0,
          reason: 'No se ejecutó en esta ejecución',
        },
        tests: [],
      })
    }
  }

  const stages = [...partials.map((p) => p.stage), input.self]
  return validateRunResult({
    schemaVersion: SCHEMA_VERSION,
    runId: input.runId,
    status: stages.some((s) => s.blocking && s.status === 'failed') ? 'failed' : 'passed',
    startedAt: input.startedAt,
    finishedAt: new Date().toISOString(),
    origin: input.origin,
    git: input.git,
    stages,
    tests: withTriage(partials.flatMap((p) => p.tests)),
    requirements: loadRequirementCatalog(input.root),
    metrics: Object.assign({}, ...partials.map((p) => p.metrics ?? {})),
    findings: partials.flatMap((p) => p.findings ?? []),
    agentActions: readAgentActions(input.root).actions,
    ...(input.injectedDefect ? { injectedDefect: input.injectedDefect } : {}),
  })
}

export function readRunMeta(runDir: string): { startedAt: string; injectedDefect?: string } | null {
  const file = `${runDir}/meta.json`
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}
