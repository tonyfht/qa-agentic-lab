import type { RunResult, StageResult, TestResult } from '../qa/results/schema'

export type RequirementStatus = 'passed' | 'flaky' | 'failed' | 'untested'

export interface Kpi {
  label: string
  value: string
  /** Text of the change against the previous run; null when there is no previous run. */
  delta: string | null
  trend: 'better' | 'worse' | 'same' | null
}

export interface TraceRow {
  id: string
  title: string
  capability: string
  status: RequirementStatus
  tests: {
    title: string
    kind: string
    status: TestResult['status']
    detailHref: string | null
    message?: string
  }[]
}

const KINDS: [string, string][] = [
  ['@e2e', 'E2E'],
  ['@unit', 'unitaria'],
  ['@build', 'arranque'],
  ['@static', 'estática'],
  ['@governance', 'gobierno'],
]

/** Test type shown in the report, from the test's tags. */
export function testKind(test: TestResult): string {
  return KINDS.find(([tag]) => test.tags.includes(tag))?.[1] ?? 'otra'
}

/** Drops the leading "QA-012 Requirement name ›" of unit tests: the row already names the requirement. */
export function displayTitle(title: string): string {
  const parts = title.split(' › ')
  return parts.length > 1 && /^[A-Z]+-\d{3}\b/.test(parts[0]) ? parts.slice(1).join(' › ') : title
}

export interface ReportModel {
  generatedAt: string
  run: {
    runId: string
    label: string
    status: RunResult['status']
    branch: string
    sha: string
    origin: string
    workflowRunUrl: string | null
    finishedAt: string
  }
  kpis: Kpi[]
  stages: StageResult[]
  trend: { minRuns: number; runs: { label: string; passed: number; flaky: number; failed: number; skipped: number }[] }
  coverage: Record<RequirementStatus, number>
  traceability: TraceRow[]
  untraced: { title: string; file: string }[]
}

/** "#12" for CI runs; day/month and UTC time for local runs. */
export function runLabel(run: RunResult): string {
  if (run.origin.runNumber) return `#${run.origin.runNumber}`
  const [, month, day, hour, minute] = /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(run.startedAt) ?? []
  return `${day}/${month} ${hour}:${minute}`
}

export function countByStatus(tests: TestResult[]) {
  const count = (s: TestResult['status']) => tests.filter((t) => t.status === s).length
  return { passed: count('passed'), flaky: count('flaky'), failed: count('failed'), skipped: count('skipped') }
}

export function runDurationMs(run: RunResult): number {
  return Math.max(0, Date.parse(run.finishedAt) - Date.parse(run.startedAt))
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`
}

export function requirementStatus(tests: TestResult[]): RequirementStatus {
  if (tests.length === 0) return 'untested'
  if (tests.some((t) => t.status === 'failed')) return 'failed'
  if (tests.some((t) => t.status === 'flaky')) return 'flaky'
  if (tests.every((t) => t.status === 'skipped')) return 'untested'
  return 'passed'
}

function testsByRequirement(run: RunResult): Map<string, TestResult[]> {
  const map = new Map<string, TestResult[]>()
  for (const t of run.tests) for (const id of t.requirements) map.set(id, [...(map.get(id) ?? []), t])
  return map
}

export function coveredCount(run: RunResult): number {
  const byReq = testsByRequirement(run)
  return run.requirements.filter((r) => (byReq.get(r.id) ?? []).length > 0).length
}

function delta(current: number, previous: number | undefined, unit: string, higherIsBetter: boolean): Pick<Kpi, 'delta' | 'trend'> {
  if (previous === undefined) return { delta: null, trend: null }
  const diff = current - previous
  if (diff === 0) return { delta: 'Igual que la ejecución anterior', trend: 'same' }
  const better = higherIsBetter ? diff > 0 : diff < 0
  return { delta: `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)} ${unit} que la ejecución anterior`, trend: better ? 'better' : 'worse' }
}

/**
 * Turns the history into what the report shows. Every figure answers one question (QA-014).
 * `detailHref` returns a link only when the technical detail of that run is actually published (QA-016).
 */
export function buildModel(history: RunResult[], hasDetail: (runId: string) => boolean): ReportModel {
  if (history.length === 0) throw new Error('El histórico está vacío: ejecuta `npm run qa` primero')
  const run = history[history.length - 1]
  const prev = history.length > 1 ? history[history.length - 2] : undefined
  const counts = countByStatus(run.tests)
  const executed = run.tests.length - counts.skipped
  const untraced = run.tests.filter((t) => t.requirements.length === 0)
  const durationSeconds = Math.round(runDurationMs(run) / 1000)

  const kpis: Kpi[] = [
    {
      label: 'Tests superados',
      value: `${counts.passed} / ${executed}`,
      ...delta(counts.passed, prev ? countByStatus(prev.tests).passed : undefined, 'tests superados', true),
    },
    {
      label: 'Requisitos cubiertos',
      value: `${coveredCount(run)} / ${run.requirements.length}`,
      ...delta(coveredCount(run), prev ? coveredCount(prev) : undefined, 'requisitos', true),
    },
    {
      label: 'Tests sin trazar',
      value: String(untraced.length),
      ...(untraced.length === 0
        ? { delta: 'Todos ligados a un requisito', trend: 'better' as const }
        : delta(untraced.length, prev?.tests.filter((t) => t.requirements.length === 0).length, 'tests', false)),
    },
    {
      label: 'Duración total',
      value: formatDuration(runDurationMs(run)),
      ...delta(durationSeconds, prev ? Math.round(runDurationMs(prev) / 1000) : undefined, 's', false),
    },
  ]

  const byReq = testsByRequirement(run)
  const detailHref = (t: TestResult) =>
    t.detail && hasDetail(run.runId) ? `runs/${run.runId}/${t.detail.path.replace(/^playwright-report\//, 'playwright/')}` : null

  const traceability: TraceRow[] = run.requirements.map((r) => {
    const tests = byReq.get(r.id) ?? []
    return {
      id: r.id,
      title: r.title,
      capability: r.capability,
      status: requirementStatus(tests),
      tests: tests.map((t) => ({
        title: displayTitle(t.title),
        kind: testKind(t),
        status: t.status,
        detailHref: detailHref(t),
        message: t.message,
      })),
    }
  })

  const coverage = { passed: 0, flaky: 0, failed: 0, untested: 0 }
  for (const row of traceability) coverage[row.status] += 1

  return {
    generatedAt: new Date().toISOString(),
    run: {
      runId: run.runId,
      label: runLabel(run),
      status: run.status,
      branch: run.git.branch,
      sha: run.git.sha.slice(0, 7),
      origin: run.origin.kind === 'ci' ? 'GitHub Actions' : 'Ejecución local',
      workflowRunUrl: run.origin.workflowRunUrl ?? null,
      finishedAt: run.finishedAt,
    },
    kpis,
    stages: run.stages,
    trend: { minRuns: 2, runs: history.slice(-30).map((r) => ({ label: runLabel(r), ...countByStatus(r.tests) })) },
    coverage,
    traceability,
    untraced: untraced.map((t) => ({ title: t.title, file: t.file })),
  }
}
