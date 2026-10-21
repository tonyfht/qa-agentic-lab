import type { RunResult } from '../results/schema'

export interface RunStability {
  runId: string
  startedAt: string
  executed: number
  flaky: number
  /** Share of executed tests that only passed on retry, 0..1. */
  rate: number
}

export interface UnstableTest {
  title: string
  file: string
  runs: number
  flaky: number
  rate: number
  lastFlakyAt: string
}

export const STABILITY_WINDOW = 20

const key = (t: { title: string; file: string }) => `${t.file}::${t.title}`

/**
 * Flakiness over the last `window` runs (QA-051): the rate of each run and the tests that needed a retry, keyed by
 * file and title so they survive changes of the Playwright id. Skipped tests are not executions.
 */
export function stability(history: RunResult[], window = STABILITY_WINDOW): { runs: RunStability[]; unstable: UnstableTest[] } {
  const recent = history.slice(-window)
  const byTest = new Map<string, UnstableTest>()
  const runs = recent.map((run) => {
    const executed = run.tests.filter((t) => t.status !== 'skipped')
    for (const t of executed) {
      const entry = byTest.get(key(t)) ?? { title: t.title, file: t.file, runs: 0, flaky: 0, rate: 0, lastFlakyAt: '' }
      entry.runs++
      if (t.status === 'flaky') {
        entry.flaky++
        entry.lastFlakyAt = run.startedAt
      }
      byTest.set(key(t), entry)
    }
    const flaky = executed.filter((t) => t.status === 'flaky').length
    return { runId: run.runId, startedAt: run.startedAt, executed: executed.length, flaky, rate: executed.length ? flaky / executed.length : 0 }
  })
  const unstable = [...byTest.values()]
    .filter((t) => t.flaky > 0)
    .map((t) => ({ ...t, rate: t.flaky / t.runs }))
    .sort((a, b) => b.rate - a.rate || b.flaky - a.flaky || a.title.localeCompare(b.title))
  return { runs, unstable }
}
