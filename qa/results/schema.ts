import { z } from 'zod'
import { AgentAction } from '../agents/registry'

// Contract of a single pipeline run (local or CI). Every later change extends it without breaking history:
// new fields are optional, and an incompatible change bumps SCHEMA_VERSION and adds an upgrader in history.ts.
export const SCHEMA_VERSION = 1 as const

export const REQUIREMENT_ID = /^[A-Z]+-\d{3}$/

export const StageStatus = z.enum(['passed', 'failed', 'skipped', 'not_run'])
export const TestStatus = z.enum(['passed', 'failed', 'flaky', 'skipped'])

export const StageResult = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  blocking: z.boolean(),
  status: StageStatus,
  durationMs: z.number().int().nonnegative(),
  reason: z.string().optional(),
})

export const TestDetail = z.object({
  kind: z.enum(['playwright-report', 'trace', 'screenshot', 'video']),
  path: z.string().min(1),
})

export const TestResult = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  file: z.string(),
  stage: z.string().min(1),
  status: TestStatus,
  durationMs: z.number().int().nonnegative(),
  retries: z.number().int().nonnegative(),
  requirements: z.array(z.string().regex(REQUIREMENT_ID)),
  tags: z.array(z.string()),
  // Failure message or skip reason, shown in the report.
  message: z.string().optional(),
  detail: TestDetail.optional(),
})

export const Requirement = z.object({
  id: z.string().regex(REQUIREMENT_ID),
  title: z.string().min(1),
  capability: z.string().min(1),
  source: z.string().min(1),
})

// A normalised security or compliance finding (QAL-007). `accepted` carries the reason when it is a versioned exception.
export const Finding = z.object({
  source: z.enum(['semgrep', 'npm-audit', 'licenses', 'zap']),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  title: z.string().min(1),
  location: z.string().optional(),
  scope: z.enum(['production', 'development']).optional(),
  accepted: z.string().optional(),
})

export const RunResult = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  runId: z.string().min(1),
  status: z.enum(['passed', 'failed']),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  origin: z.object({
    kind: z.enum(['local', 'ci']),
    workflowRunUrl: z.url().optional(),
    runNumber: z.number().int().positive().optional(),
  }),
  git: z.object({ sha: z.string(), branch: z.string(), dirty: z.boolean() }),
  stages: z.array(StageResult),
  tests: z.array(TestResult),
  requirements: z.array(Requirement),
  // Non-functional metrics since QAL-006, security findings since QAL-007, agent actions since QAL-003.
  metrics: z.record(z.string(), z.unknown()),
  findings: z.array(Finding),
  agentActions: z.array(AgentAction),
})

export type StageStatus = z.infer<typeof StageStatus>
export type TestStatus = z.infer<typeof TestStatus>
export type StageResult = z.infer<typeof StageResult>
export type TestResult = z.infer<typeof TestResult>
export type Requirement = z.infer<typeof Requirement>
export type Finding = z.infer<typeof Finding>
export type RunResult = z.infer<typeof RunResult>

export class RunResultValidationError extends Error {
  constructor(readonly issues: z.core.$ZodIssue[]) {
    super(
      'El resultado no cumple el esquema run-result v' +
        SCHEMA_VERSION +
        ':\n' +
        issues.map((i) => `  - ${i.path.join('.') || '(raíz)'}: ${i.message}`).join('\n'),
    )
    this.name = 'RunResultValidationError'
  }
}

export function validateRunResult(input: unknown): RunResult {
  const parsed = RunResult.safeParse(input)
  if (!parsed.success) throw new RunResultValidationError(parsed.error.issues)
  return parsed.data
}

export function runResultJsonSchema() {
  return z.toJSONSchema(RunResult, { target: 'draft-2020-12' })
}
