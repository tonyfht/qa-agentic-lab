import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

/** Stops of the QA flow (QA-039): the design phases, the pipeline stages (with their stage id) and "after a failure". */
export const FLOW_STOPS = [
  { id: 'spec', short: 'R', name: 'Requisitos' },
  { id: 'design', short: 'D', name: 'Diseño' },
  { id: 'automation', short: 'A', name: 'Automatización' },
  { id: 'static', short: '1', name: 'Estático', stage: 'static' },
  { id: 'build', short: '2', name: 'Tienda', stage: 'build' },
  { id: 'e2e', short: '3', name: 'E2E', stage: 'e2e' },
  { id: 'performance', short: '4', name: 'Rendimiento', stage: 'performance' },
  { id: 'security', short: '5', name: 'Seguridad', stage: 'security' },
  { id: 'report', short: '6', name: 'Informe', stage: 'report' },
  { id: 'publish', short: '7', name: 'Publicar' },
  { id: 'failure', short: '!', name: 'Tras un fallo' },
] as const

export type FlowStopId = (typeof FLOW_STOPS)[number]['id']
export const AGENT_FAMILIES = ['diseno', 'automatizacion', 'auditoria', 'operacion', 'salida'] as const
export type AgentFamily = (typeof AGENT_FAMILIES)[number]

interface AgentEntry {
  id: string
  file: string
  name: string
  phase: string
  family: AgentFamily
  /** What it does, in one sentence (QA-057). */
  summary: string
  /** What it may never do, in one sentence. */
  forbidden: string
  stops: readonly FlowStopId[]
  /** A real sample of its work in the repository. */
  sample: string
}

/** The QA agents of the lab, in cycle order. The id is what the action log and the report use. */
export const AGENTS = [
  {
    id: 'revisor-specs', file: 'qa-revisor-specs.md', name: 'Revisor de specs', phase: 'Requisitos', family: 'diseno',
    summary: 'Lee cada especificación antes de probar nada y señala ambigüedades, huecos y requisitos que no se pueden comprobar.',
    forbidden: 'Modificar las specs: propone y una persona decide.',
    stops: ['spec'], sample: 'qa/agents/reviews/catalog.md',
  },
  {
    id: 'analista', file: 'qa-analista.md', name: 'Analista', phase: 'Diseño', family: 'diseno',
    summary: 'Convierte los requisitos en escenarios Gherkin legibles por cualquiera, con su riesgo y su prioridad.',
    forbidden: 'Inventar comportamiento que la spec no pide.',
    stops: ['spec', 'design'], sample: 'tests/features/catalog/filtros.feature',
  },
  {
    id: 'disenador', file: 'qa-disenador.md', name: 'Diseñador de casos', phase: 'Diseño', family: 'diseno',
    summary: 'Aplica técnicas de diseño (valores límite, tablas de decisión, pairwise) para probar más con menos casos.',
    forbidden: 'Añadir casos sin declarar la técnica que los justifica.',
    stops: ['design'], sample: 'tests/features/catalog/combinaciones.feature',
  },
  {
    id: 'automatizador', file: 'qa-automatizador.md', name: 'Automatizador', phase: 'Automatización', family: 'automatizacion',
    summary: 'Escribe los steps de Playwright que ejecutan los escenarios y solo entrega lo que pasa en verde.',
    forbidden: 'Usar esperas fijas para tapar inestabilidad o entregar tests en rojo.',
    stops: ['automation', 'e2e'], sample: 'tests/steps/cart.steps.ts',
  },
  {
    id: 'api', file: 'qa-api.md', name: 'Agente de API', phase: 'Automatización', family: 'automatizacion',
    summary: 'Prueba la API contra su contrato OpenAPI y mantiene el barrido que comprueba todas sus lecturas.',
    forbidden: 'Cambiar el contrato para que una respuesta lo cumpla.',
    stops: ['automation', 'e2e'], sample: 'tests/support/contract-sweep.ts',
  },
  {
    id: 'auditor-experiencia', file: 'qa-auditor-experiencia.md', name: 'Auditor de experiencia', phase: 'No funcional', family: 'auditoria',
    summary: 'Traduce accesibilidad, rendimiento, regresión visual y carga a lo que notaría un cliente.',
    forbidden: 'Relajar presupuestos, umbrales o referencias visuales.',
    stops: ['e2e', 'performance'], sample: 'qa/agents/reviews/experiencia-rediseno-2026-10-21.md',
  },
  {
    id: 'auditor-seguridad', file: 'qa-auditor-seguridad.md', name: 'Auditor de seguridad y cumplimiento', phase: 'Seguridad y cumplimiento', family: 'auditoria',
    summary: 'Prioriza los hallazgos de Semgrep, npm audit, licencias y OWASP ZAP por riesgo real y revisa cada excepción.',
    forbidden: 'Aceptar excepciones o rebajar la gravedad por su cuenta.',
    stops: ['security'], sample: 'qa/agents/reviews/seguridad-2026-10-21.md',
  },
  {
    id: 'triaje', file: 'qa-triaje.md', name: 'Triaje', phase: 'Operación', family: 'operacion',
    summary: 'Decide de quién es cada fallo (producto, test, entorno o inestable) y abre el defecto con su evidencia.',
    forbidden: 'Cambiar tests o código: decide de quién es el fallo, no lo arregla.',
    stops: ['report', 'failure'], sample: 'qa/agents/reviews/triaje-2026-10-21.md',
  },
  {
    id: 'sanador', file: 'qa-sanador.md', name: 'Sanador', phase: 'Operación', family: 'operacion',
    summary: 'Repara los tests que se rompen por cambios no funcionales, como un localizador que ha cambiado.',
    forbidden: 'Tocar una aserción, un escenario o la tienda: una guardia lo bloquea.',
    stops: ['failure', 'static'], sample: 'qa/agents/reviews/sanador-2026-10-21.md',
  },
  {
    id: 'detector-flaky', file: 'qa-detector-flaky.md', name: 'Detector de inestables', phase: 'Operación', family: 'operacion',
    summary: 'Mide con el histórico qué tests solo pasan al reintentar y distingue si es el test o el entorno.',
    forbidden: 'Poner un test en cuarentena por su cuenta o subir reintentos para taparlo.',
    stops: ['report', 'failure'], sample: 'qa/agents/reviews/estabilidad-2026-10-21.md',
  },
  {
    id: 'reportero', file: 'qa-reportero.md', name: 'Reportero', phase: 'Informe y salida', family: 'salida',
    summary: 'Explica en lenguaje de negocio la recomendación de salida y qué ha cambiado frente al histórico.',
    forbidden: 'Cambiar la recomendación o suavizar un motivo de bloqueo.',
    stops: ['report', 'publish'], sample: 'qa/agents/reviews/reportero-2026-10-21.md',
  },
] as const satisfies readonly AgentEntry[]

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

/** QA-056: every agent of the registry is introduced in the README ("Conoce a los agentes") and linked to its definition. */
export function checkAgentPresentations(readme: string, agents: readonly Pick<AgentEntry, 'name' | 'file'>[] = AGENTS): string[] {
  const start = readme.indexOf('## Conoce a los agentes')
  if (start < 0) return ['README.md: falta la sección "Conoce a los agentes"']
  const end = readme.indexOf('\n## ', start + 1)
  const section = readme.slice(start, end < 0 ? undefined : end)
  return agents.flatMap((a) => {
    const heading = new RegExp(`^### .*\\b${a.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm')
    if (!heading.test(section)) return [`README.md: falta la presentación de ${a.name}`]
    return section.includes(`(.claude/agents/${a.file})`) ? [] : [`README.md: la presentación de ${a.name} no enlaza a su definición`]
  })
}

/** QA-057: every agent says what it does, what it may not do, its family and valid, non-repeated flow stops. */
export function checkAgentFlow(root: string, agents: readonly AgentEntry[]): string[] {
  const known = new Set<string>(FLOW_STOPS.map((s) => s.id))
  const errors: string[] = []
  for (const a of agents) {
    if (!a.summary?.trim()) errors.push(`${a.name}: falta el resumen de lo que hace`)
    if (!a.forbidden?.trim()) errors.push(`${a.name}: falta lo que tiene prohibido`)
    if (!AGENT_FAMILIES.includes(a.family)) errors.push(`${a.name}: familia desconocida «${a.family}»`)
    if (a.stops.length === 0) errors.push(`${a.name}: no interviene en ninguna parada del flujo`)
    for (const s of a.stops) if (!known.has(s)) errors.push(`${a.name}: parada desconocida «${s}»`)
    if (new Set(a.stops).size !== a.stops.length) errors.push(`${a.name}: paradas repetidas`)
    if (!existsSync(path.join(root, a.sample))) errors.push(`${a.name}: la muestra ${a.sample} no existe`)
  }
  return errors
}
