import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export const TYPOLOGY_TAGS = ['@e2e', '@api', '@a11y', '@visual', '@performance', '@load', '@security', '@compliance']
export const PRIORITY_TAGS = ['@p1', '@p2', '@p3']
export const TECHNIQUE_TAGS = ['@valores-limite', '@clases-equivalencia', '@tabla-decision', '@pairwise']
const REQUIREMENT_TAG = /^@[A-Z]+-\d{3}$/

export interface GherkinScenario {
  file: string
  line: number
  name: string
  outline: boolean
  /** Feature + scenario + examples tags: what Playwright sees on the generated test. */
  tags: string[]
}

/**
 * Minimal reader: tags, Feature, Scenario/Scenario Outline and Examples. Enough to lint tags without a dependency;
 * anything else (steps, tables, docstrings) is ignored.
 */
export function parseFeature(content: string, file: string): GherkinScenario[] {
  const scenarios: GherkinScenario[] = []
  let pending: string[] = []
  let featureTags: string[] = []
  let current: GherkinScenario | null = null
  content.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    if (line.startsWith('#') || line === '') return
    if (line.startsWith('@')) {
      pending.push(...line.split(/\s+/).filter((t) => t.startsWith('@')))
      return
    }
    if (/^Feature:/.test(line)) {
      featureTags = pending
    } else if (/^Scenario( Outline)?:/.test(line)) {
      current = {
        file,
        line: i + 1,
        name: line.replace(/^Scenario( Outline)?:\s*/, ''),
        outline: line.startsWith('Scenario Outline'),
        tags: [...featureTags, ...pending],
      }
      scenarios.push(current)
    } else if (/^Examples:/.test(line) && current) {
      current.tags.push(...pending)
    } else if (/^(Rule|Background):/.test(line)) {
      // tags before Rule apply like feature tags would; Background has none
      featureTags = [...featureTags, ...pending]
    }
    pending = []
  })
  return scenarios
}

export function featureFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const f = path.join(dir, e)
    return statSync(f).isDirectory() ? featureFiles(f) : e.endsWith('.feature') ? [f] : []
  })
}

/** QA-009 / QA-043: requirement that exists, typology, priority, and a technique on every Scenario Outline. */
export function lintScenarios(scenarios: GherkinScenario[], knownRequirements: Set<string>): string[] {
  const errors: string[] = []
  for (const s of scenarios) {
    const where = `${s.file}:${s.line} «${s.name}»`
    const reqs = s.tags.filter((t) => REQUIREMENT_TAG.test(t))
    if (reqs.length === 0) errors.push(`${where}: sin etiqueta de requisito`)
    for (const r of reqs) if (!knownRequirements.has(r.slice(1))) errors.push(`${where}: el requisito ${r} no existe`)
    if (!s.tags.some((t) => TYPOLOGY_TAGS.includes(t))) errors.push(`${where}: sin etiqueta de tipología (${TYPOLOGY_TAGS.join(', ')})`)
    if (!s.tags.some((t) => PRIORITY_TAGS.includes(t))) errors.push(`${where}: sin prioridad (@p1, @p2, @p3)`)
    if (s.outline && !s.tags.some((t) => TECHNIQUE_TAGS.includes(t))) {
      errors.push(`${where}: Scenario Outline sin técnica de diseño (${TECHNIQUE_TAGS.join(', ')})`)
    }
  }
  return errors
}

export function lintFeatures(root: string, knownRequirements: Set<string>): string[] {
  const dir = path.join(root, 'tests', 'features')
  const scenarios = featureFiles(dir).flatMap((f) =>
    parseFeature(readFileSync(f, 'utf8'), path.relative(root, f).split(path.sep).join('/')),
  )
  return lintScenarios(scenarios, knownRequirements)
}
