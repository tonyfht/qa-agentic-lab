// Performance budgets (EXP-004) and load thresholds (EXP-005). Pure: the stage measures, these functions judge.

export interface LighthousePage {
  page: string
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  lcpMs: number
  cls: number
  tbtMs: number
}

export interface LoadResult {
  p95Ms: number
  errorRate: number
  requests: number
  vus: number
  durationS: number
}

export const LIGHTHOUSE_BUDGET = {
  performance: 85,
  accessibility: 90,
  bestPractices: 90,
  seo: 90,
  lcpMs: 2500,
  cls: 0.1,
  tbtMs: 300,
} as const

export const LOAD_THRESHOLDS = { p95Ms: 500, errorRate: 0.01 } as const

const seconds = (ms: number) => `${(ms / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} s`

/** One message per exceeded budget, e.g. "LCP 3,1 s > 2,5 s". Scores are 0–100. */
export function lighthouseProblems(r: LighthousePage, budget = LIGHTHOUSE_BUDGET): string[] {
  const problems: string[] = []
  const score = (label: string, value: number, min: number) => {
    if (value < min) problems.push(`${label} ${value} < ${min}`)
  }
  score('Rendimiento', r.performance, budget.performance)
  score('Accesibilidad', r.accessibility, budget.accessibility)
  score('Buenas prácticas', r.bestPractices, budget.bestPractices)
  score('SEO', r.seo, budget.seo)
  if (r.lcpMs > budget.lcpMs) problems.push(`LCP ${seconds(r.lcpMs)} > ${seconds(budget.lcpMs)}`)
  if (r.cls > budget.cls) problems.push(`CLS ${r.cls.toLocaleString('es-ES')} > ${budget.cls.toLocaleString('es-ES')}`)
  if (r.tbtMs > budget.tbtMs) problems.push(`TBT ${Math.round(r.tbtMs)} ms > ${budget.tbtMs} ms`)
  return problems
}

export function loadProblems(r: LoadResult, t = LOAD_THRESHOLDS): string[] {
  const problems: string[] = []
  if (r.p95Ms >= t.p95Ms) problems.push(`p95 ${Math.round(r.p95Ms)} ms ≥ ${t.p95Ms} ms`)
  if (r.errorRate >= t.errorRate) {
    problems.push(`errores ${(r.errorRate * 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} % ≥ ${t.errorRate * 100} %`)
  }
  return problems
}

/** Lighthouse JSON (lhr) → the figures the budget looks at. Scores are 0–1 in Lighthouse, 0–100 here. */
export function fromLighthouseReport(page: string, lhr: {
  categories: Record<string, { score: number | null }>
  audits: Record<string, { numericValue?: number }>
}): LighthousePage {
  const score = (k: string) => Math.round((lhr.categories[k]?.score ?? 0) * 100)
  return {
    page,
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
    lcpMs: Math.round(lhr.audits['largest-contentful-paint']?.numericValue ?? 0),
    cls: Number((lhr.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
    tbtMs: Math.round(lhr.audits['total-blocking-time']?.numericValue ?? 0),
  }
}

/** k6 --summary-export JSON → load figures. */
export function fromK6Summary(summary: {
  metrics: Record<string, { 'p(95)'?: number; rate?: number; value?: number; count?: number; max?: number }>
}, durationS: number): LoadResult {
  const m = summary.metrics
  return {
    p95Ms: Math.round(m.http_req_duration?.['p(95)'] ?? 0),
    errorRate: m.http_req_failed?.value ?? m.http_req_failed?.rate ?? 0,
    requests: m.http_reqs?.count ?? 0,
    vus: m.vus_max?.max ?? m.vus_max?.value ?? 0,
    durationS,
  }
}
