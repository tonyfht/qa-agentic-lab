import { mkdirSync, mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkPullRequestBody } from '@/qa/stages/governance'

function repoWith(...dirs: string[]): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'qal-gov-'))
  dirs.forEach((d) => mkdirSync(path.join(root, 'openspec', 'changes', d), { recursive: true }))
  return root
}

describe('QA-021 Cada PR identifica su cambio', () => {
  const root = repoWith('qal-002-catalogo', 'archive/2026-10-30-qal-001-fundacion')

  it('pasa con el ID de un cambio en curso', () => {
    expect(checkPullRequestBody('Implementa QAL-002', root)).toMatchObject({ ok: true })
  })

  it('pasa con el ID de un cambio archivado', () => {
    expect(checkPullRequestBody('Cierra QAL-001', root)).toMatchObject({ ok: true })
  })

  it('falla sin ID y explica qué añadir', () => {
    const r = checkPullRequestBody('Arreglo cosas', root)
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/Añade su ID/)
  })

  it('el marcador de la plantilla (QAL-XXX) no cuenta como ID', () => {
    expect(checkPullRequestBody('Cambio: QAL-XXX', root).ok).toBe(false)
  })

  it('falla si el cambio citado no existe', () => {
    const r = checkPullRequestBody('Implementa QAL-999', root)
    expect(r).toMatchObject({ ok: false })
    expect(r.message).toMatch(/QAL-999/)
  })

  it('pasa si se marca la casilla de mantenimiento', () => {
    expect(checkPullRequestBody('- [x] Es mantenimiento (sin cambio de OpenSpec)', root)).toMatchObject({ ok: true })
  })

  it('los PR de Dependabot son mantenimiento aunque no lleven ID', () => {
    expect(checkPullRequestBody('Bumps next from 16.4.2 to 16.5.0', root, 'dependabot[bot]')).toMatchObject({ ok: true })
    expect(checkPullRequestBody('Bumps next', root, 'alguien')).toMatchObject({ ok: false })
  })

  it('una casilla de mantenimiento sin marcar no basta', () => {
    expect(checkPullRequestBody('- [ ] Es mantenimiento (sin cambio de OpenSpec)', root).ok).toBe(false)
  })
})
