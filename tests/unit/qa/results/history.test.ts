import { appendFileSync, mkdtempSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { appendRun, readHistory } from '@/qa/results/history'
import { sampleRun } from './fixtures'

const tmpFile = () => path.join(mkdtempSync(path.join(os.tmpdir(), 'qal-hist-')), 'history', 'runs.ndjson')

describe('QA-012 Histórico acumulado', () => {
  it('añade exactamente un registro sin modificar los anteriores', () => {
    const file = tmpFile()
    appendRun(file, sampleRun({ runId: 'r1' }))
    appendRun(file, sampleRun({ runId: 'r2' }))
    const before = readFileSync(file, 'utf8')
    appendRun(file, sampleRun({ runId: 'r3' }))
    expect(readFileSync(file, 'utf8').startsWith(before)).toBe(true)
    expect(readHistory(file).map((r) => r.runId)).toEqual(['r1', 'r2', 'r3'])
  })

  it('un resultado inválido no modifica el histórico', () => {
    const file = tmpFile()
    appendRun(file, sampleRun({ runId: 'r1' }))
    const before = readFileSync(file, 'utf8')
    expect(() => appendRun(file, { ...sampleRun(), runId: '' })).toThrow(/runId/)
    expect(readFileSync(file, 'utf8')).toBe(before)
  })

  it('lee registros de una versión de esquema anterior', () => {
    const file = tmpFile()
    appendRun(file, sampleRun({ runId: 'r1' }))
    const legacy: Record<string, unknown> = { ...sampleRun({ runId: 'old' }), schemaVersion: 0 }
    for (const key of ['requirements', 'metrics', 'findings', 'agentActions', 'status']) delete legacy[key]
    appendFileSync(file, JSON.stringify(legacy) + '\n')
    expect(readHistory(file)[1]).toMatchObject({ runId: 'old', schemaVersion: 1, status: 'passed', requirements: [] })
  })

  it('rechaza registros de una versión más nueva que la soportada', () => {
    const file = tmpFile()
    appendRun(file, sampleRun({ runId: 'r1' }))
    appendFileSync(file, JSON.stringify({ ...sampleRun(), schemaVersion: 99 }) + '\n')
    expect(() => readHistory(file)).toThrow(/más nueva/)
  })

  it('un histórico inexistente se lee como vacío', () => {
    expect(readHistory(tmpFile())).toEqual([])
  })
})
