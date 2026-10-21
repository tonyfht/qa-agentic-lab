import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { runCommand, tail } from '../lib/exec'

const HEADER = /^### Requirement:\s*(.*)$/

function specFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((e) => {
    const f = path.join(dir, e)
    return statSync(f).isDirectory() ? specFiles(f) : e === 'spec.md' ? [f] : []
  })
}

/** QA-009: every requirement has an ID, normative language and at least two scenarios (happy path + error/limit). */
export function lintSpec(markdown: string, file: string, superseded: Set<string> = new Set()): string[] {
  const errors: string[] = []
  const blocks = markdown.split(/(?=^### Requirement:)/m).filter((b) => HEADER.test(b.split('\n')[0]))
  for (const block of blocks) {
    const title = HEADER.exec(block.split('\n')[0])![1].trim()
    if (superseded.has(title)) continue
    const where = `${file} «${title}»`
    if (!/^[A-Z]+-\d{3}\s/.test(title)) errors.push(`${where}: el nombre no empieza por un ID (por ejemplo CAT-001)`)
    const description = block.split(/^#### Scenario:/m)[0]
    if (!/\b(SHALL|MUST)\b/.test(description)) errors.push(`${where}: sin lenguaje normativo (SHALL/MUST)`)
    const scenarios = block.match(/^#### Scenario:/gm)?.length ?? 0
    if (scenarios < 2) errors.push(`${where}: ${scenarios} escenario(s); hacen falta al menos dos (incluido uno de error o límite)`)
  }
  return errors
}

/**
 * Lints the main specs and the deltas of in-flight changes. A main requirement that an in-flight change rewrites
 * (MODIFIED) is judged by its new text, not the old one.
 */
export function lintAllSpecs(root: string): string[] {
  const rel = (f: string) => path.relative(root, f).split(path.sep).join('/')
  const changes = path.join(root, 'openspec', 'changes')
  const deltaFiles = (existsSync(changes) ? readdirSync(changes) : [])
    .filter((c) => c !== 'archive')
    .flatMap((c) => specFiles(path.join(changes, c, 'specs')))
  const superseded = new Set(
    deltaFiles.flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/^### Requirement:\s*(.*)$/gm)].map((m) => m[1].trim()),
    ),
  )
  return [
    ...specFiles(path.join(root, 'openspec', 'specs')).flatMap((f) => lintSpec(readFileSync(f, 'utf8'), rel(f), superseded)),
    ...deltaFiles.flatMap((f) => lintSpec(readFileSync(f, 'utf8'), rel(f))),
  ]
}

/** `openspec validate` on the main specs and on every in-flight change. */
export async function openspecValidate(root: string): Promise<string[]> {
  const errors: string[] = []
  const specs = await runCommand('npx openspec validate --specs --strict --no-interactive', { cwd: root, quiet: true })
  if (specs.code !== 0) errors.push(`openspec validate --specs:\n${tail(specs.output)}`)
  const changes = path.join(root, 'openspec', 'changes')
  for (const c of existsSync(changes) ? readdirSync(changes) : []) {
    if (c === 'archive' || !statSync(path.join(changes, c)).isDirectory()) continue
    const r = await runCommand(`npx openspec validate ${c} --strict --no-interactive`, { cwd: root, quiet: true })
    if (r.code !== 0) errors.push(`openspec validate ${c}:\n${tail(r.output)}`)
  }
  return errors
}
