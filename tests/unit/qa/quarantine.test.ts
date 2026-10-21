import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyQuarantine, checkQuarantine, type QuarantineEntry } from '@/qa/quarantine'
import type { TestResult } from '@/qa/results/schema'

const entry: QuarantineEntry = {
  titulo: 'Carrito › El carrito se conserva al recargar',
  fichero: 'tests/features/cart/carrito.feature',
  motivo: 'El navegador tarda en cerrarse en Windows',
  issue: 'https://github.com/tonyfht/qa-agentic-lab/issues/99',
  desde: '2026-10-21',
  hasta: '2026-11-04',
}

const test = (title: string, status: TestResult['status']): TestResult => ({
  id: title,
  title,
  file: 'tests/features/cart/carrito.feature',
  stage: 'e2e',
  status,
  durationMs: 1,
  retries: 0,
  requirements: [],
  tags: [],
  message: 'Timeout',
})

describe('QA-028 Cuarentena con caducidad', () => {
  it('una entrada completa y vigente es válida', () => {
    expect(checkQuarantine({ tests: [entry] }, '2026-10-30')).toEqual([])
  })

  it('una entrada caducada falla nombrando el test y pidiendo corregirlo o renovarla', () => {
    const [error] = checkQuarantine({ tests: [entry] }, '2026-11-05')
    expect(error).toMatch(/^Carrito › El carrito se conserva al recargar: la cuarentena caducó el 2026-11-04/)
    expect(error).toMatch(/renueva la entrada con un motivo nuevo/)
  })

  it('más de 14 días entre alta y caducidad no se permite', () => {
    expect(checkQuarantine({ tests: [{ ...entry, hasta: '2026-11-05' }] }, '2026-10-21')).toEqual([
      'Carrito › El carrito se conserva al recargar: la cuarentena dura 15 días; el máximo es 14',
    ])
  })

  it('sin issue o sin motivo no es una cuarentena', () => {
    const { issue: _issue, ...withoutIssue } = entry
    expect(checkQuarantine({ tests: [withoutIssue, { ...entry, motivo: '' }] }, '2026-10-21')).toHaveLength(2)
  })

  it('el test en cuarentena sigue fallando, avisado, pero no bloquea; los demás sí', () => {
    const { tests, blocking } = applyQuarantine(
      [test(entry.titulo, 'failed'), test('Carrito › Otro', 'failed'), test('Carrito › Bien', 'passed')],
      [entry],
    )
    expect(tests[0]).toMatchObject({ status: 'failed', message: 'En cuarentena: Timeout' })
    expect(blocking.map((t) => t.title)).toEqual(['Carrito › Otro'])
  })

  it('el fichero del repositorio es válido hoy', () => {
    const json = JSON.parse(readFileSync(path.resolve(__dirname, '../../../qa/cuarentena.json'), 'utf8'))
    expect(checkQuarantine(json, new Date().toISOString().slice(0, 10))).toEqual([])
  })
})
