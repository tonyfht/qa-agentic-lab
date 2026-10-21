import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Reporter, Suite, TestCase } from '@playwright/test/reporter'
import { REQUIREMENT_ID, type TestResult } from '../../qa/results/schema'

const ANSI = /\u001b\[[0-9;]*m/g

// playwright-bdd generates `.features-gen/<path>.feature.spec.js`; the report shows the .feature it came from.
export function sourceFile(location: string, root: string): string {
  const rel = path.relative(root, location).split(path.sep).join('/')
  return rel.replace(/^\.features-gen\//, '').replace(/\.spec\.[jt]s$/, '')
}

const STATUS: Record<ReturnType<TestCase['outcome']>, TestResult['status']> = {
  expected: 'passed',
  unexpected: 'failed',
  flaky: 'flaky',
  skipped: 'skipped',
}

export function toTestResult(test: TestCase, root: string): TestResult {
  const tags = test.tags
  const requirements = tags.map((t) => t.replace(/^@/, '')).filter((t) => REQUIREMENT_ID.test(t))
  const status = STATUS[test.outcome()]
  const last = test.results[test.results.length - 1]
  const skipReason = status === 'skipped' ? test.annotations.find((a) => a.type === 'skip')?.description : undefined
  const failure = (
    skipReason ??
    test.results
      .map((r) => r.error?.message)
      .filter(Boolean)
      .join('\n')
  )
    .replace(ANSI, '')
    .trim()
  return {
    id: test.id,
    title: test.titlePath().slice(3).join(' › ') || test.title,
    file: sourceFile(test.location.file, root),
    stage: 'e2e',
    status,
    durationMs: test.results.reduce((sum, r) => sum + r.duration, 0),
    retries: Math.max(0, test.results.length - 1),
    requirements: [...new Set(requirements)],
    tags,
    ...(failure ? { message: failure.slice(0, 2000) } : {}),
    // The Playwright HTML report opens directly on this test (trace, screenshots, video).
    ...(status === 'failed' || status === 'flaky' || last?.attachments.length
      ? { detail: { kind: 'playwright-report' as const, path: `playwright-report/index.html#?testId=${test.id}` } }
      : {}),
  }
}

/** Writes the e2e tests in run-result format: requirement IDs from tags, flaky when a retry passed (QA-005, QA-011). */
export default class RunResultReporter implements Reporter {
  private suite?: Suite
  constructor(private readonly options: { outputFile: string }) {}

  onBegin(_config: unknown, suite: Suite) {
    this.suite = suite
  }

  onEnd() {
    const root = process.cwd()
    const tests = (this.suite?.allTests() ?? []).map((t) => toTestResult(t, root))
    mkdirSync(path.dirname(this.options.outputFile), { recursive: true })
    writeFileSync(this.options.outputFile, JSON.stringify(tests, null, 2))
  }

  printsToStdio() {
    return false
  }
}
