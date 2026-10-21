import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkAgentDefinitions, readAgentActions, AGENTS } from '@/qa/agents/registry'
import { lintFeatures, lintScenarios, parseFeature } from '@/qa/checks/gherkin'
import { lintAllSpecs, lintSpec } from '@/qa/checks/specs'
import { loadRequirementCatalog } from '@/qa/results/requirements'

const root = path.resolve(__dirname, '../../..')
const known = new Set(['CAT-001', 'CAT-004'])

describe('QA-009 Calidad de especificaciones y escenarios', () => {
  it('el repositorio cumple: specs y escenarios bien formados', () => {
    expect(lintAllSpecs(root)).toEqual([])
    expect(lintFeatures(root, new Set(loadRequirementCatalog(root).map((r) => r.id)))).toEqual([])
  })

  it('señala un requisito sin ID, sin SHALL/MUST o con un solo escenario', () => {
    const md = [
      '### Requirement: Algo sin ID',
      'El sistema hace cosas.',
      '#### Scenario: Único',
      '- **WHEN** x',
      '### Requirement: CAT-010 Bien',
      'El sistema SHALL hacerlo.',
      '#### Scenario: A',
      '#### Scenario: B',
    ].join('\n')
    const errors = lintSpec(md, 'spec.md')
    expect(errors).toHaveLength(3)
    expect(errors.join('\n')).toMatch(/no empieza por un ID/)
    expect(errors.join('\n')).toMatch(/sin lenguaje normativo/)
    expect(errors.join('\n')).toMatch(/1 escenario\(s\)/)
  })

  it('lee las etiquetas heredadas de Feature y de Examples', () => {
    const feature = '@CAT-001 @p1\nFeature: X\n  @e2e\n  Scenario: A\n    When x\n  @api @pairwise\n  Scenario Outline: B\n    When <x>\n    @extra\n    Examples:\n      | x |\n'
    const [a, b] = parseFeature(feature, 'x.feature')
    expect(a).toMatchObject({ line: 4, outline: false, tags: ['@CAT-001', '@p1', '@e2e'] })
    expect(b).toMatchObject({ outline: true, tags: ['@CAT-001', '@p1', '@api', '@pairwise', '@extra'] })
  })

  it('señala requisito inexistente, falta de tipología y de prioridad', () => {
    const errors = lintScenarios(parseFeature('Feature: X\n  @CAT-099\n  Scenario: Huérfano\n', 'x.feature'), known)
    expect(errors).toEqual([
      'x.feature:3 «Huérfano»: el requisito @CAT-099 no existe',
      'x.feature:3 «Huérfano»: sin etiqueta de tipología (@e2e, @api, @a11y, @visual, @performance, @load, @security, @compliance)',
      'x.feature:3 «Huérfano»: sin prioridad (@p1, @p2, @p3)',
    ])
  })

  it('un escenario sin ningún requisito se señala', () => {
    expect(lintScenarios(parseFeature('@e2e @p1\nFeature: X\n  Scenario: Sin req\n', 'x.feature'), known)[0]).toMatch(
      /sin etiqueta de requisito/,
    )
  })
})

describe('QA-043 Diseñador de casos con técnica declarada', () => {
  it('un Scenario Outline sin técnica se señala; con técnica pasa', () => {
    const without = parseFeature('@CAT-004 @api @p1\nFeature: X\n  Scenario Outline: Límites\n', 'x.feature')
    expect(lintScenarios(without, known)[0]).toMatch(/sin técnica de diseño/)
    const withTech = parseFeature('@CAT-004 @api @p1\nFeature: X\n  @valores-limite\n  Scenario Outline: Límites\n', 'x.feature')
    expect(lintScenarios(withTech, known)).toEqual([])
  })
})

describe('QA-040 Agentes versionados con función y límites', () => {
  it('los agentes del laboratorio tienen definición completa', () => {
    expect(checkAgentDefinitions(root)).toEqual([])
    expect(AGENTS.map((a) => a.id)).toEqual(['revisor-specs', 'analista', 'disenador', 'automatizador', 'api', 'auditor-experiencia', 'auditor-seguridad', 'sanador', 'detector-flaky', 'triaje', 'reportero'])
  })

  it('una definición sin prohibiciones se señala con el agente y la sección', () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'qal-agents-'))
    mkdirSync(path.join(tmp, '.claude', 'agents'), { recursive: true })
    for (const a of AGENTS) {
      writeFileSync(
        path.join(tmp, '.claude', 'agents', a.file),
        `---\nname: ${a.id}\ndescription: x\ntools: Read\n---\n## Función\n## Entradas\n## Salidas\n## Herramientas\n${a.id === 'analista' ? '' : '## Prohibido\n'}## Registro\n`,
      )
    }
    expect(checkAgentDefinitions(tmp)).toEqual(['qa-analista.md: falta la sección "Prohibido"'])
  })
})

describe('QA-045 Registro de actuaciones de los agentes', () => {
  it('el registro del repositorio valida contra su esquema', () => {
    const { actions, errors } = readAgentActions(root)
    expect(errors).toEqual([])
    expect(actions.length).toBeGreaterThanOrEqual(2)
  })

  it('una entrada sin agente o con un agente desconocido se señala con línea y campo', () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'qal-log-'))
    mkdirSync(path.join(tmp, 'qa', 'agents'), { recursive: true })
    const ok = { date: '2026-10-21T10:00:00.000Z', agent: 'analista', change: 'QAL-003', action: 'x', artifacts: [], summary: 'y', executedBy: 'z' }
    writeFileSync(
      path.join(tmp, 'qa', 'agents', 'actions.ndjson'),
      [JSON.stringify(ok), JSON.stringify({ ...ok, agent: 'pirata' }), 'no json'].join('\n'),
    )
    const { actions, errors } = readAgentActions(tmp)
    expect(actions).toHaveLength(1)
    expect(errors[0]).toMatch(/actions\.ndjson:2: agent/)
    expect(errors[1]).toMatch(/actions\.ndjson:3: no es JSON válido/)
  })
})

describe('QA-048 Auditor de experiencia', () => {
  const def = readFileSync(path.join(root, '.claude/agents/qa-auditor-experiencia.md'), 'utf8')

  it('tiene prohibido relajar presupuestos, umbrales o referencias', () => {
    const forbidden = def.slice(def.indexOf('## Prohibido'), def.indexOf('## Registro'))
    expect(forbidden).toMatch(/Cambiar presupuestos, umbrales o referencias visuales/)
  })

  it('su auditoría tiene un hallazgo por fila con impacto, prioridad y propuesta', () => {
    const dir = path.join(root, 'qa/agents/reviews')
    const audits = readdirSync(dir).filter((f) => f.startsWith('experiencia-'))
    expect(audits.length).toBeGreaterThan(0)
    const audit = readFileSync(path.join(dir, audits[0]), 'utf8')
    expect(audit).toMatch(/\| # \| Hallazgo \| Métrica y valor \| Impacto para el cliente \| Prioridad \| Propuesta \|/)
  })
})

describe('QA-049 Auditor de seguridad y cumplimiento', () => {
  const def = readFileSync(path.join(root, '.claude/agents/qa-auditor-seguridad.md'), 'utf8')

  it('su auditoría prioriza cada hallazgo con fuente, riesgo real y propuesta', () => {
    const dir = path.join(root, 'qa/agents/reviews')
    const audits = readdirSync(dir).filter((f) => f.startsWith('seguridad-'))
    expect(audits.length).toBeGreaterThan(0)
    const audit = readFileSync(path.join(dir, audits[0]), 'utf8')
    expect(audit).toMatch(/\| # \| Hallazgo \| Fuente \| Riesgo real \| Prioridad \| Propuesta \| Estado \|/)
  })

  it('tiene prohibido añadir excepciones o rebajar la gravedad por su cuenta', () => {
    const forbidden = def.slice(def.indexOf('## Prohibido'), def.indexOf('## Registro'))
    expect(forbidden).toMatch(/Añadir o ampliar excepciones/)
    expect(forbidden).toMatch(/Rebajar la gravedad/)
  })
})

describe('QA-055 Reportero', () => {
  const def = readFileSync(path.join(root, '.claude/agents/qa-reportero.md'), 'utf8')

  it('tiene prohibido cambiar la recomendación o suavizar un bloqueo', () => {
    const forbidden = def.slice(def.indexOf('## Prohibido'), def.indexOf('## Registro'))
    expect(forbidden).toMatch(/Cambiar la recomendación, sus reglas o sus umbrales/)
    expect(forbidden).toMatch(/Omitir o suavizar un motivo de bloqueo/)
  })

  it('su resumen dice la recomendación, qué ha cambiado y qué falta para salir sin reservas', () => {
    const dir = path.join(root, 'qa/agents/reviews')
    const summaries = readdirSync(dir).filter((f) => f.startsWith('reportero-'))
    expect(summaries.length).toBeGreaterThan(0)
    const text = readFileSync(path.join(dir, summaries[0]), 'utf8')
    expect(text).toMatch(/^## Recomendación: /m)
    expect(text).toMatch(/^## Qué ha cambiado$/m)
    expect(text).toMatch(/^## Para seguir saliendo sin reservas$/m)
  })
})

describe('QA-041 Revisor de especificaciones', () => {
  it('cada revisión es una tabla de hallazgos con requisito, tipo, gravedad y propuesta', () => {
    const dir = path.join(root, 'qa/agents/reviews')
    // Dated files (<tema>-AAAA-MM-DD.md) are the auditors' reports; the rest are spec reviews.
    const reviews = readdirSync(dir).filter((f) => f.endsWith('.md') && !/-\d{4}-\d{2}-\d{2}\.md$/.test(f))
    expect(reviews.length).toBeGreaterThanOrEqual(3)
    for (const f of reviews) {
      expect(readFileSync(path.join(dir, f), 'utf8'), f).toMatch(/\| # \| Requisito \| Tipo \| Gravedad \| Qué dice \| Propuesta \|/)
    }
  })

  it('tiene prohibido modificar las specs', () => {
    const def = readFileSync(path.join(root, '.claude/agents/qa-revisor-specs.md'), 'utf8')
    expect(def.slice(def.indexOf('## Prohibido'))).toMatch(/Modificar ficheros de `openspec\/`/)
  })
})

describe('QA-044 Automatizador que solo entrega lo que pasa', () => {
  it('ningún step usa esperas fijas para tapar inestabilidad', () => {
    const dir = path.join(root, 'tests/steps')
    for (const f of readdirSync(dir)) {
      expect(readFileSync(path.join(dir, f), 'utf8'), f).not.toMatch(/waitForTimeout\(/)
    }
  })

  it('tiene prohibido cambiar aserciones existentes y entregar escenarios en rojo', () => {
    const def = readFileSync(path.join(root, '.claude/agents/qa-automatizador.md'), 'utf8')
    const forbidden = def.slice(def.indexOf('## Prohibido'))
    expect(forbidden).toMatch(/Modificar aserciones/)
    expect(forbidden).toMatch(/Entregar un escenario en rojo/)
  })
})
