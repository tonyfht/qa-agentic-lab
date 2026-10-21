import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

/** The QA agents of the lab. The id is what the action log and the report use. */
export const AGENTS = [
  { id: 'revisor-specs', file: 'qa-revisor-specs.md', name: 'Revisor de specs', phase: 'Requisitos' },
  { id: 'analista', file: 'qa-analista.md', name: 'Analista', phase: 'Diseño' },
  { id: 'disenador', file: 'qa-disenador.md', name: 'Diseñador de casos', phase: 'Diseño' },
  { id: 'automatizador', file: 'qa-automatizador.md', name: 'Automatizador', phase: 'Automatización' },
  { id: 'api', file: 'qa-api.md', name: 'Agente de API', phase: 'Automatización' },
  { id: 'auditor-experiencia', file: 'qa-auditor-experiencia.md', name: 'Auditor de experiencia', phase: 'No funcional' },
  { id: 'auditor-seguridad', file: 'qa-auditor-seguridad.md', name: 'Auditor de seguridad y cumplimiento', phase: 'Seguridad y cumplimiento' },
  { id: 'sanador', file: 'qa-sanador.md', name: 'Sanador', phase: 'Operación' },
  { id: 'detector-flaky', file: 'qa-detector-flaky.md', name: 'Detector de inestables', phase: 'Operación' },
  { id: 'triaje', file: 'qa-triaje.md', name: 'Triaje', phase: 'Operación' },
] as const

export type AgentId = (typeof AGENTS)[number]['id']
export const AGENT_IDS = AGENTS.map((a) => a.id) as [AgentId, ...AgentId[]]
export const AGENTS_DIR = path.join('.claude', 'agents')
export const ACTIONS_FILE = path.join('qa', 'agents', 'actions.ndjson')

export const AgentAction = z.object({
  date: z.iso.datetime(),
  agent: z.enum(AGENT_IDS),
  change: z.string().min(1),
  action: z.string().min(1),
  artifacts: z.array(z.string()),
  summary: z.string().min(1),
  executedBy: z.string().min(1),
})
export type AgentAction = z.infer<typeof AgentAction>

/** Reads the action log. Errors carry the line number and field (QA-045). */
export function readAgentActions(root: string): { actions: AgentAction[]; errors: string[] } {
  const file = path.join(root, ACTIONS_FILE)
  if (!existsSync(file)) return { actions: [], errors: [] }
  const actions: AgentAction[] = []
  const errors: string[] = []
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (!line.trim()) return
      let json: unknown
      try {
        json = JSON.parse(line)
      } catch {
        errors.push(`${ACTIONS_FILE}:${i + 1}: no es JSON válido`)
        return
      }
      const parsed = AgentAction.safeParse(json)
      if (parsed.success) actions.push(parsed.data)
      else errors.push(...parsed.error.issues.map((e) => `${ACTIONS_FILE}:${i + 1}: ${e.path.join('.') || '(raíz)'} ${e.message}`))
    })
  return { actions, errors }
}

export const REQUIRED_SECTIONS = ['Función', 'Entradas', 'Salidas', 'Herramientas', 'Prohibido', 'Registro'] as const

/** Every QA agent definition has frontmatter and the six sections (QA-040). */
export function checkAgentDefinitions(root: string): string[] {
  const errors: string[] = []
  for (const agent of AGENTS) {
    const file = path.join(root, AGENTS_DIR, agent.file)
    if (!existsSync(file)) {
      errors.push(`${agent.file}: no existe la definición del agente ${agent.name}`)
      continue
    }
    const content = readFileSync(file, 'utf8')
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content)?.[1] ?? ''
    for (const key of ['name', 'description', 'tools']) {
      if (!new RegExp(`^${key}:\\s*\\S`, 'm').test(front)) errors.push(`${agent.file}: falta "${key}" en el frontmatter`)
    }
    for (const section of REQUIRED_SECTIONS) {
      if (!new RegExp(`^## ${section}\\s*$`, 'm').test(content)) errors.push(`${agent.file}: falta la sección "${section}"`)
    }
  }
  return errors
}
