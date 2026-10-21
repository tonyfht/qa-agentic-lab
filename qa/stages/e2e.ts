import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { resetE2eDatabase } from '../lib/e2e'
import { runCommand, tail } from '../lib/exec'
import { applyQuarantine, readQuarantine } from '../quarantine'
import type { TestResult } from '../results/schema'
import type { StageDefinition } from './types'

export const E2E_RESULTS_FILE = 'e2e-tests.json'

/** Gherkin scenarios run by Playwright against the store on the E2E port; the reporter writes the traced tests. */
export const e2eStage: StageDefinition = {
  id: 'e2e',
  name: 'Smoke y E2E',
  blocking: true,
  dependsOn: ['build'],
  async run(ctx) {
    resetE2eDatabase(ctx.root)
    const env = { QA_RUN_DIR: ctx.runDir }
    const gen = await runCommand('npx bddgen', { cwd: ctx.root, env })
    if (gen.code !== 0) return { status: 'failed', reason: `No se pudieron generar los tests desde Gherkin:\n${tail(gen.output)}` }

    const { code, output } = await runCommand('npx playwright test', { cwd: ctx.root, env })
    const resultsFile = path.join(ctx.runDir, E2E_RESULTS_FILE)
    const raw: TestResult[] = existsSync(resultsFile) ? JSON.parse(readFileSync(resultsFile, 'utf8')) : []
    if (code === 0) return { status: 'passed', tests: raw }
    // Failures of quarantined tests are reported but do not block (QA-028).
    const { tests, blocking } = applyQuarantine(raw, readQuarantine(ctx.root))
    const quarantined = tests.filter((t) => t.status === 'failed').length - blocking.length
    if (blocking.length === 0 && quarantined > 0) {
      return { status: 'passed', reason: `${quarantined} test(s) en cuarentena fallaron (no bloquean)`, tests }
    }
    return {
      status: 'failed',
      reason: blocking.length ? `Fallan: ${blocking.map((t) => t.title).join(', ')}` : `Playwright terminó con error:\n${tail(output)}`,
      tests,
    }
  },
}
