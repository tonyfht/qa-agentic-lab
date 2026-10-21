// Guard for the Sanador's pull requests (QA-050): principle 4 of AGENTS.md checked by a machine. The Sanador may change
// how a test finds things (locators, waits) but never what it expects, the scenarios or the store.

export const HEALER_MARKER = /^\s*Agente:\s*sanador\s*$/im
export const HEALER_PATHS = ['tests/steps/', 'tests/support/']

const EXPECT = /\bexpect(?:\.soft)?\(/

/** What follows `expect(...)` on the line, e.g. `.toHaveText(text)`: the matcher and the expected value. */
export function assertionTail(line: string): string | null {
  const match = EXPECT.exec(line)
  if (!match) return null
  let depth = 0
  let quote: string | null = null
  for (let i = match.index + match[0].length - 1; i < line.length; i++) {
    const c = line[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
    } else if (c === "'" || c === '"' || c === '`') quote = c
    else if (c === '(') depth++
    else if (c === ')' && --depth === 0) return line.slice(i + 1).trim()
  }
  // An assertion split over several lines cannot be compared: treated as changed, which blocks more, never less.
  return line.slice(match.index).trim()
}

interface FileDiff {
  path: string
  removed: string[]
  added: string[]
}

export function parseDiff(diff: string): FileDiff[] {
  const files: FileDiff[] = []
  let current: FileDiff | null = null
  for (const line of diff.split(/\r?\n/)) {
    const header = /^diff --git a\/(.+?) b\/(.+)$/.exec(line)
    if (header) {
      current = { path: header[2], removed: [], added: [] }
      files.push(current)
    } else if (!current || line.startsWith('---') || line.startsWith('+++')) continue
    else if (line.startsWith('-')) current.removed.push(line.slice(1))
    else if (line.startsWith('+')) current.added.push(line.slice(1))
  }
  return files
}

/** Errors for a Sanador diff; empty when it only repairs how tests find things. */
export function checkHealerDiff(diff: string): string[] {
  const errors: string[] = []
  for (const file of parseDiff(diff)) {
    if (!HEALER_PATHS.some((p) => file.path.startsWith(p))) {
      errors.push(`${file.path}: el Sanador solo puede tocar ${HEALER_PATHS.join(' y ')}`)
      continue
    }
    const added = file.added.map(assertionTail).filter((t): t is string => t !== null)
    for (const line of file.removed) {
      const tail = assertionTail(line)
      if (tail === null) continue
      const at = added.indexOf(tail)
      if (at >= 0) added.splice(at, 1)
      else errors.push(`${file.path}: cambia o elimina la aserción «${line.trim()}»`)
    }
  }
  return errors
}
