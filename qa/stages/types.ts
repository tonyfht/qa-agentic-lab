import type { StageResult, TestResult } from '../results/schema'

export interface StageContext {
  root: string
  runId: string
  runDir: string
  /** Extra CLI options (e.g. --pr-body for governance). */
  options: Record<string, string>
  log: (message: string) => void
}

export interface StageOutcome {
  status: 'passed' | 'failed' | 'skipped'
  reason?: string
  tests?: TestResult[]
  /** Non-functional figures (Lighthouse, load…) merged into run.metrics. */
  metrics?: Record<string, unknown>
}

export interface StageDefinition {
  id: string
  name: string
  blocking: boolean
  dependsOn: string[]
  /** Stages left out of `npm run qa` without --stage (e.g. governance, which needs a PR). */
  standalone?: boolean
  /** Returns the reason the stage cannot run in this environment, or null when it can (QA-007). */
  missingRequirement?: (ctx: StageContext) => string | null
  /** When running a single stage, a dependency that is already satisfied is not re-run (e.g. a downloaded build). */
  isSatisfied?: (ctx: StageContext) => boolean
  run: (ctx: StageContext) => Promise<StageOutcome>
}

export interface StagePartial {
  stage: StageResult
  tests: TestResult[]
  metrics?: Record<string, unknown>
}
