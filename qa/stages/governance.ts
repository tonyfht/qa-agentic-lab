import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { StageDefinition } from './types'

const CHANGE_ID = /\bQAL-(\d{3})\b/g
const MAINTENANCE = /^\s*-\s*\[x\]\s*.*mantenimiento/im
const MAINTENANCE_BOTS = new Set(['dependabot[bot]'])

function changeExists(root: string, number: string): boolean {
  const changes = path.join(root, 'openspec', 'changes')
  const prefix = `qal-${number}-`
  const matches = (dir: string, name: (d: string) => string) =>
    existsSync(dir) && readdirSync(dir).some((d) => name(d).toLowerCase().startsWith(prefix))
  // Archived changes carry an AAAA-MM-DD- prefix (11 characters).
  return matches(changes, (d) => d) || matches(path.join(changes, 'archive'), (d) => (/^\d{4}-\d{2}-\d{2}-/.test(d) ? d.slice(11) : ''))
}

/** QA-021: every PR names the OpenSpec change it implements, or declares itself maintenance. */
export function checkPullRequestBody(body: string, root: string, author = ''): { ok: boolean; message: string } {
  // Dependency update bots cannot tick the checkbox; their PRs are maintenance by definition.
  if (MAINTENANCE_BOTS.has(author)) return { ok: true, message: `PR de mantenimiento de ${author}` }
  const ids = [...new Set([...body.matchAll(CHANGE_ID)].map((m) => m[1]))]
  if (ids.length === 0) {
    return MAINTENANCE.test(body)
      ? { ok: true, message: 'PR de mantenimiento declarado' }
      : {
          ok: false,
          message:
            'El PR no indica qué cambio implementa. Añade su ID (por ejemplo QAL-002) en la descripción ' +
            'o marca la casilla "Es mantenimiento" de la plantilla.',
        }
  }
  const unknown = ids.filter((n) => !changeExists(root, n))
  if (unknown.length > 0) {
    return {
      ok: false,
      message: `No existe en openspec/changes el cambio ${unknown.map((n) => `QAL-${n}`).join(', ')}.`,
    }
  }
  return { ok: true, message: `Implementa ${ids.map((n) => `QAL-${n}`).join(', ')}` }
}

function prBody(options: Record<string, string>): string | null {
  if (options['pr-body']) return readFileSync(options['pr-body'], 'utf8')
  return process.env.PR_BODY ?? null
}

export const governanceStage: StageDefinition = {
  id: 'governance',
  name: 'Gobierno del PR',
  blocking: true,
  dependsOn: [],
  standalone: true,
  missingRequirement: (ctx) =>
    prBody(ctx.options) === null ? 'Falta la descripción del PR (--pr-body <fichero> o PR_BODY)' : null,
  async run(ctx) {
    const started = Date.now()
    const result = checkPullRequestBody(prBody(ctx.options) ?? '', ctx.root, process.env.PR_AUTHOR ?? '')
    ctx.log(`  · ${result.message}`)
    return {
      status: result.ok ? 'passed' : 'failed',
      reason: result.ok ? undefined : result.message,
      tests: [
        {
          id: 'governance-change-id',
          title: 'El PR identifica el cambio de OpenSpec que implementa',
          file: '',
          stage: 'governance',
          status: result.ok ? 'passed' : 'failed',
          durationMs: Date.now() - started,
          retries: 0,
          requirements: ['QA-021'],
          tags: ['@governance'],
          message: result.message,
        },
      ],
    }
  },
}
