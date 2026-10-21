import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AGENTS, checkAgentPresentations } from '@/qa/agents/registry'

const readme = readFileSync(path.resolve(__dirname, '../../../README.md'), 'utf8')

describe('QA-056 Presentación de los agentes', () => {
  it('el README presenta a todos los agentes del registro, con enlace a su definición', () => {
    expect(checkAgentPresentations(readme)).toEqual([])
  })

  it('las presentaciones siguen el orden del ciclo del registro', () => {
    const positions = AGENTS.map((a) => readme.search(new RegExp(`^### .*${a.name}\\s*$`, 'm')))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('un agente nuevo sin presentar hace fallar la comprobación, nombrándolo', () => {
    const extra = [...AGENTS, { name: 'Agente de prueba', file: 'qa-prueba.md' }]
    expect(checkAgentPresentations(readme, extra)).toEqual(['README.md: falta la presentación de Agente de prueba'])
  })

  it('una presentación sin enlace a la definición también se detecta', () => {
    const md = '## Conoce a los agentes\n\n### 🔎 Revisor de specs\n\nTexto sin enlace.\n\n## Otra\n'
    expect(checkAgentPresentations(md, [{ name: 'Revisor de specs', file: 'qa-revisor-specs.md' }])).toEqual([
      'README.md: la presentación de Revisor de specs no enlaza a su definición',
    ])
  })
})
