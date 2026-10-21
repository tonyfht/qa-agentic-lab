import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { serializedJsonSchema, SCHEMA_FILE } from '@/qa/results/export-schema'
import { RunResultValidationError, validateRunResult } from '@/qa/results/schema'
import { sampleRun } from './fixtures'

describe('QA-010 Resultado de ejecución con esquema versionado', () => {
  it('acepta un resultado válido e indica su schemaVersion', () => {
    expect(validateRunResult(sampleRun()).schemaVersion).toBe(1)
  })

  it('rechaza un resultado inválido indicando el campo que incumple', () => {
    const bad = {
      ...sampleRun(),
      stages: [{ id: 'static', name: 'x', blocking: true, status: 'green', durationMs: 1 }],
    }
    expect(() => validateRunResult(bad)).toThrow(RunResultValidationError)
    expect(() => validateRunResult(bad)).toThrow(/stages\.0\.status/)
  })

  it('rechaza IDs de requisito mal formados', () => {
    const run = sampleRun()
    run.tests[0].requirements = ['qa-1']
    expect(() => validateRunResult(run)).toThrow(/tests\.0\.requirements\.0/)
  })

  it('el JSON Schema publicado está al día con el esquema Zod', () => {
    expect(readFileSync(SCHEMA_FILE, 'utf8').replace(/\r\n/g, '\n')).toBe(serializedJsonSchema())
  })
})
