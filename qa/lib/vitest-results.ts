import path from 'node:path'
import type { TestResult } from '../results/schema'

const REQUIREMENT_IN_TITLE = /\b[A-Z]{2,}-\d{3}\b/g

interface VitestAssertion {
  ancestorTitles: string[]
  title: string
  fullName?: string
  status: string
  duration?: number | null
  failureMessages?: string[]
}

interface VitestJson {
  testResults: { name: string; assertionResults: VitestAssertion[] }[]
}

const STATUS: Record<string, TestResult['status']> = {
  passed: 'passed',
  failed: 'failed',
  skipped: 'skipped',
  pending: 'skipped',
  todo: 'skipped',
  disabled: 'skipped',
}

/**
 * Converts Vitest's JSON report into run-result tests. Unit tests are traced through the IDs written at the start
 * of their outermost `describe` (e.g. `describe('QA-012 Histórico acumulado', ...)`).
 */
export function fromVitestJson(report: VitestJson, root: string, stage: string): TestResult[] {
  return report.testResults.flatMap((file) => {
    const rel = path.relative(root, file.name).split(path.sep).join('/')
    return file.assertionResults.map((a, i) => {
      const requirements = [...new Set((a.ancestorTitles[0] ?? '').match(REQUIREMENT_IN_TITLE) ?? [])]
      const failure = a.failureMessages?.join('\n').trim()
      return {
        id: `${rel}#${i}`,
        title: [...a.ancestorTitles, a.title].join(' › '),
        file: rel,
        stage,
        status: STATUS[a.status] ?? 'failed',
        durationMs: Math.max(0, Math.round(a.duration ?? 0)),
        retries: 0,
        requirements,
        tags: ['@unit'],
        ...(failure ? { message: failure.slice(0, 2000) } : {}),
      }
    })
  })
}
