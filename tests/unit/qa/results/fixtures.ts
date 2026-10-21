import type { RunResult } from '@/qa/results/schema'

export function sampleRun(overrides: Partial<RunResult> = {}): RunResult {
  return {
    schemaVersion: 1,
    runId: 'local-2026-10-21T10-00-00',
    status: 'passed',
    startedAt: '2026-10-21T10:00:00.000Z',
    finishedAt: '2026-10-21T10:03:00.000Z',
    origin: { kind: 'local' },
    git: { sha: 'abc1234', branch: 'main', dirty: false },
    stages: [{ id: 'static', name: 'Análisis estático', blocking: true, status: 'passed', durationMs: 1000 }],
    tests: [
      {
        id: 'smoke-1',
        title: 'La API responde a la comprobación de salud',
        file: 'tests/features/quality/smoke.feature',
        stage: 'e2e',
        status: 'passed',
        durationMs: 120,
        retries: 0,
        requirements: ['QA-001'],
        tags: ['@QA-001', '@smoke'],
      },
    ],
    requirements: [
      { id: 'QA-001', title: 'La tienda arranca y responde', capability: 'quality-pipeline', source: 'x' },
    ],
    metrics: {},
    findings: [],
    agentActions: [],
    ...overrides,
  }
}
