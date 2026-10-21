import type { RunResult } from '../qa/results/schema'
import { blockingFindings } from '../qa/security/findings'

export type Verdict = 'si' | 'reservas' | 'no'

export interface VerdictReason {
  kind: 'blocker' | 'reservation' | 'ok'
  text: string
}

export interface ReleaseVerdict {
  verdict: Verdict
  title: string
  reasons: VerdictReason[]
}

export const VERDICT_TITLES: Record<Verdict, string> = {
  si: 'Sí, se puede salir',
  reservas: 'Salir con reservas',
  no: 'No salir',
}

/** Lighthouse varies 2-3 points between identical runs; only a bigger drop is a reservation. */
export const PERFORMANCE_DROP_POINTS = 5

const covered = (run: RunResult) => {
  const tested = new Set(run.tests.flatMap((t) => t.requirements))
  return run.requirements.filter((r) => tested.has(r.id))
}

function averagePerformance(run: RunResult | undefined): number | null {
  const pages = (run?.metrics.lighthouse as { performance: number }[] | undefined) ?? []
  return pages.length ? pages.reduce((sum, p) => sum + p.performance, 0) / pages.length : null
}

const list = (items: string[], max = 3) => items.slice(0, max).join(', ') + (items.length > max ? ` (y ${items.length - max} más)` : '')
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * QA-036: release recommendation from deterministic rules on the last run and the previous one. A blocker means
 * "no", otherwise a reservation means "with reservations", otherwise "yes". The AI never decides it (AGENTS.md, 2).
 */
export function releaseVerdict(history: RunResult[]): ReleaseVerdict {
  const run = history[history.length - 1]
  const prev = history.length > 1 ? history[history.length - 2] : undefined
  const reasons: VerdictReason[] = []
  const blocker = (text: string) => reasons.push({ kind: 'blocker', text })
  const reservation = (text: string) => reasons.push({ kind: 'reservation', text })

  if (run.injectedDefect) blocker(`Ejecución de demostración con el defecto «${run.injectedDefect}» inyectado`)
  for (const s of run.stages.filter((s) => s.blocking)) {
    if (s.status === 'failed') blocker(`La etapa «${s.name}» ha fallado`)
    if (s.status === 'not_run') blocker(`La etapa «${s.name}» no se ha ejecutado`)
  }
  const failing = [...new Set(run.tests.filter((t) => t.status === 'failed').flatMap((t) => t.requirements))].sort()
  if (failing.length) blocker(`${failing.length === 1 ? 'Falla el requisito' : 'Fallan los requisitos'} ${list(failing)}`)
  const findings = blockingFindings(run.findings).length
  if (findings) blocker(`${plural(findings, 'hallazgo de seguridad bloquea', 'hallazgos de seguridad bloquean')} la salida`)

  const flaky = run.tests.filter((t) => t.status === 'flaky')
  if (flaky.length) {
    reservation(`${plural(flaky.length, 'test solo pasó', 'tests solo pasaron')} al reintentar: ${list(flaky.map((t) => `«${t.title}»`), 2)}`)
  }
  const coveredIds = new Set(covered(run).map((r) => r.id))
  const untested = run.requirements.filter((r) => !coveredIds.has(r.id)).map((r) => r.id)
  if (untested.length) reservation(`${plural(untested.length, 'requisito sin pruebas', 'requisitos sin pruebas')}: ${list(untested)}`)
  if (prev && coveredIds.size < covered(prev).length) {
    reservation(`Cubre ${plural(covered(prev).length - coveredIds.size, 'requisito menos', 'requisitos menos')} que la ejecución anterior`)
  }
  const [perf, prevPerf] = [averagePerformance(run), averagePerformance(prev)]
  if (perf !== null && prevPerf !== null && prevPerf - perf > PERFORMANCE_DROP_POINTS) {
    reservation(`El rendimiento medio de Lighthouse baja de ${Math.round(prevPerf)} a ${Math.round(perf)}`)
  }

  const hasBlocker = reasons.some((r) => r.kind === 'blocker')
  // What is going well is said too, so the reasons read as a balance and not only as a list of problems.
  if (!run.stages.some((s) => s.blocking && s.status !== 'passed') && !run.injectedDefect) {
    reasons.push({ kind: 'ok', text: 'Todas las etapas bloqueantes en verde' })
  }
  if (!flaky.length && !hasBlocker) reasons.push({ kind: 'ok', text: 'Ningún test inestable' })
  if (!untested.length) reasons.push({ kind: 'ok', text: `Todos los requisitos tienen pruebas (${run.requirements.length})` })

  const verdict: Verdict = hasBlocker ? 'no' : reasons.some((r) => r.kind === 'reservation') ? 'reservas' : 'si'
  return { verdict, title: VERDICT_TITLES[verdict], reasons }
}

const ICON: Record<VerdictReason['kind'] | Verdict, string> = { blocker: '✖', reservation: '⚠', ok: '✔', no: '❌', reservas: '⚠️', si: '✅' }

/** QA-037: the recommendation and its reasons for the GitHub Actions job summary. */
export function verdictMarkdown(v: ReleaseVerdict): string {
  return [`## ¿Podemos salir? ${ICON[v.verdict]} ${v.title}`, '', ...v.reasons.map((r) => `- ${ICON[r.kind]} ${r.text}`), '', '_Es una recomendación calculada con reglas; la decisión de salir es de una persona._', ''].join('\n')
}
