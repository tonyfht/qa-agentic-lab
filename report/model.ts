import { AGENTS, FLOW_STOPS, type AgentFamily } from '../qa/agents/registry'
import { LIGHTHOUSE_BUDGET, LOAD_THRESHOLDS, type LighthousePage, type LoadResult } from '../qa/lib/budgets'
import type { RunResult, StageResult, TestResult } from '../qa/results/schema'
import type { QuarantineEntry } from '../qa/quarantine'
import { blockingFindings } from '../qa/security/findings'
import { STABILITY_WINDOW, stability } from '../qa/stability/stability'
import { TRIAGE_LABELS, type TriageCategory } from '../qa/triage/classify'
import { releaseVerdict, type ReleaseVerdict } from './verdict'

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
  ['@a11y', 'accesibilidad'],
  ['@visual', 'visual'],
  ['@performance', 'rendimiento'],
  ['@load', 'carga'],
  ['@security', 'seguridad'],
  ['@compliance', 'cumplimiento'],
  ['@e2e', 'E2E'],
  ['@api', 'API'],
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
  experience: ExperienceModel
  security: SecurityModel
  agents: {
    byAgent: { id: string; name: string; phase: string; count: number }[]
    latest: AgentActionView[]
  }
  stability: StabilityModel
  operations: OperationsModel
  executive: ExecutiveModel
  agentsFlow: AgentsFlowModel
  coverageByCapability: ({ capability: string } & Record<RequirementStatus, number>)[]
}

export interface AgentsFlowModel {
  /** Stops of the flow; `status` is the stage status in this run, null outside the pipeline or when it has no stage. */
  stops: { id: string; short: string; name: string; inPipeline: boolean; status: StageResult['status'] | null }[]
  agents: {
    id: string
    name: string
    family: AgentFamily
    summary: string
    forbidden: string
    stops: string[]
    definition: string
    sample: string
    actions: number
    latest: AgentActionView | null
  }[]
}

export interface ExecutiveModel {
  verdict: ReleaseVerdict
  /** Against the previous run; `previous` is null on the first run. */
  compare: { label: string; current: string; previous: string | null; better: boolean | null }[]
  reporter: AgentActionView | null
}

export interface AgentActionView {
  date: string
  agent: string
  change: string
  action: string
  summary: string
  artifacts: string[]
}

export interface StabilityModel {
  window: number
  /** Per run: share of executed tests that needed a retry, in percent with one decimal. */
  runs: { label: string; ratePct: number; flaky: number; executed: number }[]
  unstable: { title: string; file: string; runs: number; flaky: number; ratePct: number; lastFlakyAt: string }[]
  quarantine: QuarantineEntry[]
}

export interface OperationsModel {
  injectedDefect: string | null
  byCategory: { category: TriageCategory; label: string; count: number }[]
  failures: { title: string; requirements: string[]; category: TriageCategory; label: string; reason: string }[]
  actions: AgentActionView[]
}

export interface ExperienceModel {
  lighthouse: LighthousePage[]
  load: LoadResult | null
  /** Per run: average Lighthouse performance and load p95 (null when that run had none). */
  trend: { label: string; performance: number | null; p95Ms: number | null }[]
  a11y: { title: string; status: TestResult['status'] }[]
  budget: typeof LIGHTHOUSE_BUDGET
  thresholds: typeof LOAD_THRESHOLDS
}

function lighthouseOf(run: RunResult): LighthousePage[] {
  const v = (run.metrics as { lighthouse?: LighthousePage[] }).lighthouse
  return Array.isArray(v) ? v : []
}

function loadOf(run: RunResult): LoadResult | null {
  const v = (run.metrics as { load?: LoadResult }).load
  return v && typeof v.p95Ms === 'number' ? v : null
}

/** QA-018: is it usable and fast? Lighthouse per page, load, their trend and the accessibility checks. */
export function experienceSummary(history: RunResult[]): ExperienceModel {
  const run = history[history.length - 1]
  return {
    lighthouse: lighthouseOf(run),
    load: loadOf(run),
    trend: history.slice(-30).map((r) => {
      const lh = lighthouseOf(r)
      return {
        label: runLabel(r),
        performance: lh.length ? Math.round(lh.reduce((s, p) => s + p.performance, 0) / lh.length) : null,
        p95Ms: loadOf(r)?.p95Ms ?? null,
      }
    }),
    a11y: run.tests.filter((t) => t.tags.includes('@a11y')).map((t) => ({ title: displayTitle(t.title), status: t.status })),
    budget: LIGHTHOUSE_BUDGET,
    thresholds: LOAD_THRESHOLDS,
  }
}

export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const
export const SOURCES = ['semgrep', 'npm-audit', 'licenses', 'zap'] as const

export interface SecurityModel {
  ran: boolean
  checks: { title: string; status: TestResult['status']; message?: string }[]
  bySource: Record<(typeof SOURCES)[number], Record<(typeof SEVERITIES)[number], number>>
  blocking: number
  accepted: { title: string; source: string; reason: string }[]
  production: Record<(typeof SEVERITIES)[number], number>
  sbomComponents: number | null
  licensedPackages: number | null
}

/** QA-026: is it secure and compliant? Findings by source and severity, exceptions with their reason, SBOM, licences. */
export function securitySummary(run: RunResult): SecurityModel {
  const zero = () => Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<(typeof SEVERITIES)[number], number>
  const bySource = Object.fromEntries(SOURCES.map((s) => [s, zero()])) as SecurityModel['bySource']
  const production = zero()
  for (const f of run.findings) {
    bySource[f.source][f.severity] += 1
    if (f.scope !== 'development') production[f.severity] += 1
  }
  const metrics = run.metrics as { sbom?: { components: number }; licenses?: { packages: number } }
  return {
    ran: run.stages.some((s) => s.id === 'security' && (s.status === 'passed' || s.status === 'failed')),
    checks: run.tests.filter((t) => t.stage === 'security').map((t) => ({ title: t.title, status: t.status, message: t.message })),
    bySource,
    blocking: blockingFindings(run.findings).length,
    accepted: run.findings.filter((f) => f.accepted).map((f) => ({ title: f.title, source: f.source, reason: f.accepted! })),
    production,
    sbomComponents: metrics.sbom?.components ?? null,
    licensedPackages: metrics.licenses?.packages ?? null,
  }
}

const pct = (x: number) => Math.round(x * 1000) / 10

/** QA-053: flaky rate per run, the most unstable tests of the window and the tests in quarantine. */
export function stabilitySummary(history: RunResult[], quarantine: QuarantineEntry[]): StabilityModel {
  const window = history.slice(-STABILITY_WINDOW)
  const { runs, unstable } = stability(window)
  return {
    window: window.length,
    runs: runs.map((r, i) => ({ label: runLabel(window[i]), ratePct: pct(r.rate), flaky: r.flaky, executed: r.executed })),
    unstable: unstable.slice(0, 10).map((t) => ({ ...t, title: displayTitle(t.title), ratePct: pct(t.rate) })),
    quarantine,
  }
}

const OPERATION_AGENTS = ['sanador', 'detector-flaky', 'triaje']
const TRIAGE_ORDER: TriageCategory[] = ['producto', 'test', 'entorno', 'inestable', 'desconocido']

/** QA-054: triage of this run per category, each failure with its reason, and what the operation agents did. */
export function operationsSummary(run: RunResult): OperationsModel {
  const triaged = run.tests.filter((t) => t.triage)
  const name = (id: string) => AGENTS.find((a) => a.id === id)?.name ?? id
  return {
    injectedDefect: run.injectedDefect ?? null,
    byCategory: TRIAGE_ORDER.map((c) => ({ category: c, label: TRIAGE_LABELS[c], count: triaged.filter((t) => t.triage!.category === c).length })),
    failures: triaged.map((t) => ({
      title: displayTitle(t.title),
      requirements: t.requirements,
      category: t.triage!.category,
      label: TRIAGE_LABELS[t.triage!.category],
      reason: t.triage!.reason,
    })),
    actions: run.agentActions
      .filter((x) => OPERATION_AGENTS.includes(x.agent))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((x) => ({ date: x.date, agent: name(x.agent), change: x.change, action: x.action, summary: x.summary, artifacts: x.artifacts })),
  }
}

/** QA-039: the flow stops with this run's stage status and every agent with where it acts and what it did. */
export function agentsFlow(run: RunResult): AgentsFlowModel {
  const stageStatus = (id?: string) => (id ? (run.stages.find((s) => s.id === id)?.status ?? null) : null)
  return {
    stops: FLOW_STOPS.map((s) => ({
      id: s.id,
      short: s.short,
      name: s.name,
      inPipeline: !['spec', 'design', 'automation', 'failure'].includes(s.id),
      status: stageStatus('stage' in s ? s.stage : undefined),
    })),
    agents: AGENTS.map((a) => {
      const mine = run.agentActions.filter((x) => x.agent === a.id).sort((x, y) => y.date.localeCompare(x.date))
      const last = mine[0]
      return {
        id: a.id,
        name: a.name,
        family: a.family,
        summary: a.summary,
        forbidden: a.forbidden,
        stops: [...a.stops],
        definition: `.claude/agents/${a.file}`,
        sample: a.sample,
        actions: mine.length,
        latest: last ? { date: last.date, agent: a.name, change: last.change, action: last.action, summary: last.summary, artifacts: last.artifacts } : null,
      }
    }),
  }
}

/** QA-037: the recommendation, the comparison with the previous run and the Reportero's latest reading. */
export function executiveSummary(history: RunResult[]): ExecutiveModel {
  const run = history[history.length - 1]
  const prev = history.length > 1 ? history[history.length - 2] : undefined
  const row = (label: string, current: number, previous: number | undefined, higherIsBetter: boolean, format: (n: number) => string = String) => ({
    label,
    current: format(current),
    previous: previous === undefined ? null : format(previous),
    better: previous === undefined || previous === current ? null : current > previous === higherIsBetter,
  })
  const blocking = (r: RunResult) => blockingFindings(r.findings).length
  const latest = [...run.agentActions].filter((a) => a.agent === 'reportero').sort((a, b) => b.date.localeCompare(a.date))[0]
  return {
    verdict: releaseVerdict(history),
    compare: [
      row('Tests superados', countByStatus(run.tests).passed, prev && countByStatus(prev.tests).passed, true),
      row('Requisitos cubiertos', coveredCount(run), prev && coveredCount(prev), true),
      row('Hallazgos que bloquean', blocking(run), prev && blocking(prev), false),
      row('Duración', runDurationMs(run), prev && runDurationMs(prev), false, formatDuration),
    ],
    reporter: latest
      ? { date: latest.date, agent: 'Reportero', change: latest.change, action: latest.action, summary: latest.summary, artifacts: latest.artifacts }
      : null,
  }
}

/** QA-038: requirements of each capability by status, to see where the gaps are. */
export function coverageByCapability(traceability: TraceRow[]): ReportModel['coverageByCapability'] {
  const byCap = new Map<string, Record<RequirementStatus, number>>()
  for (const row of traceability) {
    const counts = byCap.get(row.capability) ?? { passed: 0, flaky: 0, failed: 0, untested: 0 }
    counts[row.status] += 1
    byCap.set(row.capability, counts)
  }
  return [...byCap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([capability, counts]) => ({ capability, ...counts }))
}

/** QA-017: actions per agent (every known agent, even with zero) and the latest ones, newest first. */
export function agentsSummary(run: RunResult): ReportModel['agents'] {
  const name = (id: string) => AGENTS.find((a) => a.id === id)?.name ?? id
  return {
    byAgent: AGENTS.map((a) => ({
      id: a.id,
      name: a.name,
      phase: a.phase,
      count: run.agentActions.filter((x) => x.agent === a.id).length,
    })),
    latest: [...run.agentActions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
      .map((x) => ({ date: x.date, agent: name(x.agent), change: x.change, action: x.action, summary: x.summary, artifacts: x.artifacts })),
  }
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
  const text = `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)} ${unit} ${diff > 0 ? 'más' : 'menos'} que la ejecución anterior`
  return { delta: text, trend: better ? 'better' : 'worse' }
}

/**
 * Turns the history into what the report shows. Every figure answers one question (QA-014).
 * `detailHref` returns a link only when the technical detail of that run is actually published (QA-016).
 */
export function buildModel(
  history: RunResult[],
  hasDetail: (runId: string) => boolean,
  quarantine: QuarantineEntry[] = [],
): ReportModel {
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
    experience: experienceSummary(history),
    security: securitySummary(run),
    agents: agentsSummary(run),
    stability: stabilitySummary(history, quarantine),
    operations: operationsSummary(run),
    executive: executiveSummary(history),
    agentsFlow: agentsFlow(run),
    coverageByCapability: coverageByCapability(traceability),
  }
}
