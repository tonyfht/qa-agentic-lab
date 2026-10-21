import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Requirement } from './schema'

const HEADER = /^###\s+Requirement:\s+([A-Z]+-\d{3})\s+(.+?)\s*$/

function specFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return specFiles(full)
    return entry === 'spec.md' ? [full] : []
  })
}

export function parseRequirements(markdown: string, capability: string, source: string): Requirement[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => HEADER.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ id: m[1], title: m[2], capability, source }))
}

/**
 * Catalog of every specified requirement: main specs plus the deltas of in-flight changes.
 * A delta wins over the main spec for the same ID (it is the newer text). Archived changes are skipped:
 * their deltas are already merged into openspec/specs.
 */
export function loadRequirementCatalog(root: string): Requirement[] {
  const byId = new Map<string, Requirement>()
  const add = (file: string, specsRoot: string) => {
    const capability = path.relative(specsRoot, path.dirname(file)).split(path.sep).join('/')
    const source = path.relative(root, file).split(path.sep).join('/')
    for (const req of parseRequirements(readFileSync(file, 'utf8'), capability, source)) {
      const previous = byId.get(req.id)
      if (previous && previous.capability !== req.capability) {
        throw new Error(`ID de requisito duplicado ${req.id} en ${previous.source} y ${req.source}`)
      }
      byId.set(req.id, req)
    }
  }

  const mainSpecs = path.join(root, 'openspec', 'specs')
  specFiles(mainSpecs).forEach((f) => add(f, mainSpecs))

  const changes = path.join(root, 'openspec', 'changes')
  if (existsSync(changes)) {
    for (const change of readdirSync(changes)) {
      const specsDir = path.join(changes, change, 'specs')
      if (change === 'archive' || !existsSync(specsDir)) continue
      specFiles(specsDir).forEach((f) => add(f, specsDir))
    }
  }

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
}
