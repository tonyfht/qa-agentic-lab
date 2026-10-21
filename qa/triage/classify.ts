import type { TestResult } from '../results/schema'

export type TriageCategory = 'producto' | 'test' | 'entorno' | 'inestable' | 'desconocido'
export interface Triage {
  category: TriageCategory
  reason: string
}

export const TRIAGE_LABELS: Record<TriageCategory, string> = {
  producto: 'Defecto del producto',
  test: 'Test roto',
  entorno: 'Entorno',
  inestable: 'Inestable',
  desconocido: 'Sin clasificar',
}

// Ordered rules (QA-052): the first match wins. A 5xx also carries "Expected/Received", so it is checked before the
// product rule; a missing element also times out, so the test rule is checked before the generic timeout.
const RULES: { category: TriageCategory; reason: string; test: (message: string) => boolean }[] = [
  {
    category: 'entorno',
    reason: 'El navegador, la red o la herramienta fallaron, no la tienda',
    test: (m) =>
      /Tearing down "?\w+"? exceeded|browserContext\.close|Target page, context or browser has been closed|ECONNREFUSED|ECONNRESET|net::ERR_|socket hang up|NO_NAVSTART|Runtime error encountered|did not start|no arrancó/i.test(m),
  },
  {
    category: 'entorno',
    reason: 'El servidor respondió 5xx: un servicio no está disponible',
    test: (m) => /Received:\s*5\d\d\b|status(?: code)? 5\d\d\b|\b503 Service Unavailable/i.test(m),
  },
  {
    category: 'test',
    reason: 'El test no encuentra el elemento que busca: candidato al Sanador',
    test: (m) => /element\(s\) not found|strict mode violation|resolved to 0 elements|Received: <element\(s\) not found>/i.test(m),
  },
  {
    category: 'producto',
    reason: 'La tienda no devuelve lo que dice la spec',
    test: (m) => /Expected[\s\S]*Received/.test(m),
  },
]

/** Triage of one failed or flaky test: a category and the rule that decided it. */
export function classifyFailure(test: Pick<TestResult, 'status' | 'message'>): Triage {
  if (test.status === 'flaky') return { category: 'inestable', reason: 'Falló y pasó al reintentar' }
  const message = test.message ?? ''
  const rule = RULES.find((r) => r.test(message))
  return rule
    ? { category: rule.category, reason: rule.reason }
    : { category: 'desconocido', reason: 'Ninguna regla aplica: queda para revisión del agente de Triaje' }
}

/** Adds the triage to every failed or flaky test; the rest are returned untouched. */
export function withTriage(tests: TestResult[]): TestResult[] {
  return tests.map((t) => (t.status === 'failed' || t.status === 'flaky' ? { ...t, triage: classifyFailure(t) } : t))
}
