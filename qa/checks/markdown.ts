import { execSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

/** Markdown we publish and maintain by hand. Tool-generated folders (e.g. OpenSpec skills) are left out. */
const INCLUDED = /^(README\.md|AGENTS\.md|CLAUDE\.md|docs\/.*\.md|openspec\/.*\.md|\.github\/.*\.md)$/

export function markdownFiles(root: string): string[] {
  const listed = execSync('git ls-files --cached --others --exclude-standard', { cwd: root }).toString()
  return listed
    .split(/\r?\n/)
    .filter((f) => INCLUDED.test(f) && existsSync(path.join(root, f)))
}

/** Removes fenced and inline code so examples inside code are not checked as links. */
export function stripCode(markdown: string): string {
  return markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '')
}

/** GitHub's anchor for a heading: lower case, punctuation removed (letters with accents kept), spaces to dashes. */
export function slugify(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')
}

export function headingAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>()
  const seen = new Map<string, number>()
  for (const line of stripCode(markdown).split(/\r?\n/)) {
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line)
    if (!m) continue
    const base = slugify(m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'))
    const n = seen.get(base) ?? 0
    anchors.add(n === 0 ? base : `${base}-${n}`)
    seen.set(base, n + 1)
  }
  return anchors
}

const LINK = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)|<(?:img|source|a)\s[^>]*(?:src|srcset|href)="([^"]+)"/g

export interface BrokenLink {
  file: string
  target: string
  reason: string
}

/** Internal links (files and anchors) that do not resolve (QA-031). External links are not checked. */
export function findBrokenLinks(root: string, files: string[]): BrokenLink[] {
  const broken: BrokenLink[] = []
  for (const file of files) {
    const content = readFileSync(path.join(root, file), 'utf8')
    for (const m of stripCode(content).matchAll(LINK)) {
      const target = m[1] ?? m[2]
      if (/^([a-z]+:|\/\/)/i.test(target)) continue
      const [rawPath, anchor] = target.split('#')
      const cleanPath = decodeURIComponent(rawPath.split('?')[0])
      const resolved = cleanPath ? path.resolve(root, path.dirname(file), cleanPath) : path.join(root, file)
      if (!existsSync(resolved)) {
        broken.push({ file, target, reason: 'el fichero no existe' })
        continue
      }
      if (anchor && statSync(resolved).isFile() && resolved.endsWith('.md')) {
        if (!headingAnchors(readFileSync(resolved, 'utf8')).has(anchor.toLowerCase())) {
          broken.push({ file, target, reason: `no hay ningún encabezado con el ancla #${anchor}` })
        }
      }
    }
  }
  return broken
}

export interface MermaidBlock {
  file: string
  index: number
  code: string
}

export function mermaidBlocks(root: string, files: string[]): MermaidBlock[] {
  return files.flatMap((file) =>
    [...readFileSync(path.join(root, file), 'utf8').matchAll(/^```mermaid\s*\r?\n([\s\S]*?)^```/gm)].map((m, index) => ({
      file,
      index: index + 1,
      code: m[1],
    })),
  )
}
