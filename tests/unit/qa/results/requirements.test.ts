import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadRequirementCatalog, parseRequirements } from '@/qa/results/requirements'

const repoRoot = path.resolve(__dirname, '../../../..')

function tmpRepo(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'qal-req-'))
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
    writeFileSync(path.join(root, rel), content)
  }
  return root
}

describe('QA-011 Catálogo de requisitos para la trazabilidad', () => {
  it('lee ID y título de las cabeceras de requisito', () => {
    const md = '### Requirement: CAT-001 Búsqueda por texto\nTexto\n### Requirement: sin id\n'
    expect(parseRequirements(md, 'catalog', 'spec.md')).toEqual([
      { id: 'CAT-001', title: 'Búsqueda por texto', capability: 'catalog', source: 'spec.md' },
    ])
  })

  it('encuentra los requisitos de QAL-001 en el repositorio, sin duplicados', () => {
    const ids = loadRequirementCatalog(repoRoot).map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ['QA-001', 'QA-007', 'QA-010', 'QA-016', 'QA-020', 'QA-025', 'QA-030', 'QA-034']) {
      expect(ids).toContain(id)
    }
  })

  it('el delta de un cambio en curso prevalece sobre la spec principal y se ignora el archivo', () => {
    const root = tmpRepo({
      'openspec/specs/catalog/spec.md': '### Requirement: CAT-001 Texto antiguo\n',
      'openspec/changes/qal-002-x/specs/catalog/spec.md': '### Requirement: CAT-001 Texto nuevo\n',
      'openspec/changes/archive/old/specs/catalog/spec.md': '### Requirement: CAT-009 Archivado\n',
    })
    expect(loadRequirementCatalog(root)).toEqual([expect.objectContaining({ id: 'CAT-001', title: 'Texto nuevo' })])
  })

  it('falla si el mismo ID aparece en dos capacidades distintas', () => {
    const root = tmpRepo({
      'openspec/specs/catalog/spec.md': '### Requirement: CAT-001 Uno\n',
      'openspec/specs/cart/spec.md': '### Requirement: CAT-001 Otro\n',
    })
    expect(() => loadRequirementCatalog(root)).toThrow(/duplicado CAT-001/)
  })
})
