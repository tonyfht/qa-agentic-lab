import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { SCHEMA_VERSION, validateRunResult, type RunResult } from './schema'

type RawRecord = Record<string, unknown>

// Upgraders from an older schemaVersion to the next one, keyed by the version they read.
const upgraders: Record<number, (record: RawRecord) => RawRecord> = {
  // v0 was the pre-release draft: no requirement catalog, no overall status, no reserved sections.
  0: (r) => {
    const stages = (r.stages ?? []) as { blocking: boolean; status: string }[]
    return {
      ...r,
      schemaVersion: 1,
      status: stages.some((s) => s.blocking && s.status === 'failed') ? 'failed' : 'passed',
      requirements: r.requirements ?? [],
      metrics: r.metrics ?? {},
      findings: r.findings ?? [],
      agentActions: r.agentActions ?? [],
    }
  },
}

export function upgradeRecord(record: RawRecord): RunResult {
  let current = record
  let version = typeof current.schemaVersion === 'number' ? current.schemaVersion : 0
  if (version > SCHEMA_VERSION) {
    throw new Error(`schemaVersion ${version} es más nueva que la soportada (${SCHEMA_VERSION})`)
  }
  while (version < SCHEMA_VERSION) {
    const upgrade = upgraders[version]
    if (!upgrade) throw new Error(`No hay conversión desde schemaVersion ${version}`)
    current = upgrade(current)
    version += 1
  }
  return validateRunResult(current)
}

export function readHistory(file: string): RunResult[] {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line, i) => {
      try {
        return upgradeRecord(JSON.parse(line))
      } catch (error) {
        throw new Error(`Registro ${i + 1} de ${file} ilegible: ${(error as Error).message}`)
      }
    })
}

/** Appends exactly one validated record. An invalid run throws before touching the file. */
export function appendRun(file: string, run: unknown): RunResult {
  const valid = validateRunResult(run)
  mkdirSync(path.dirname(file), { recursive: true })
  appendFileSync(file, JSON.stringify(valid) + '\n', 'utf8')
  return valid
}
