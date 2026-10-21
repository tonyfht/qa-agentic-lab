import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { TestResult } from '../results/schema'
import { runCommand, tail } from '../lib/exec'
import { fromVitestJson } from '../lib/vitest-results'
import type { StageContext, StageDefinition } from './types'

export interface CheckOutcome {
  status: TestResult['status']
  message?: string
}

export interface StaticCheck {
  id: string
  title: string
  requirements: string[]
  run: (ctx: StageContext) => Promise<CheckOutcome>
}

const commandCheck =
  (command: string) =>
  async (ctx: StageContext): Promise<CheckOutcome> => {
    const { code, output } = await runCommand(command, { cwd: ctx.root })
    return code === 0 ? { status: 'passed' } : { status: 'failed', message: tail(output) }
  }

export const staticChecks: StaticCheck[] = [
  { id: 'lint', title: 'Lint (ESLint)', requirements: ['QA-008'], run: commandCheck('npx eslint .') },
  { id: 'types', title: 'Comprobación de tipos (tsc)', requirements: ['QA-008'], run: commandCheck('npx tsc --noEmit') },
  {
    id: 'eol',
    title: 'Saltos de línea normalizados (LF en el repositorio)',
    requirements: ['QA-025'],
    async run(ctx) {
      const { output } = await runCommand('git ls-files --eol', { cwd: ctx.root, quiet: true })
      const crlf = output.split(/\r?\n/).filter((l) => l.startsWith('i/crlf'))
      return crlf.length === 0
        ? { status: 'passed' }
        : { status: 'failed', message: `Ficheros con CRLF en el índice:\n${crlf.join('\n')}` }
    },
  },
]

/** Static analysis: each check is recorded as a test traced to its requirement; unit tests are added one by one. */
export const staticStage: StageDefinition = {
  id: 'static',
  name: 'Análisis estático',
  blocking: true,
  dependsOn: [],
  async run(ctx) {
    const tests: TestResult[] = []
    for (const check of staticChecks) {
      ctx.log(`  · ${check.title}`)
      const started = Date.now()
      const outcome = await check.run(ctx)
      tests.push({
        id: `static-${check.id}`,
        title: check.title,
        file: '',
        stage: 'static',
        status: outcome.status,
        durationMs: Date.now() - started,
        retries: 0,
        requirements: check.requirements,
        tags: ['@static'],
        ...(outcome.message ? { message: outcome.message } : {}),
      })
    }

    ctx.log('  · Pruebas unitarias (Vitest)')
    const vitestJson = path.join(ctx.runDir, 'vitest.json')
    const { code, output } = await runCommand(
      `npx vitest run --reporter=default --reporter=json --outputFile.json="${vitestJson}"`,
      { cwd: ctx.root },
    )
    if (existsSync(vitestJson)) {
      tests.push(...fromVitestJson(JSON.parse(readFileSync(vitestJson, 'utf8')), ctx.root, 'static'))
    } else if (code !== 0) {
      return { status: 'failed', reason: `Vitest no generó resultados:\n${tail(output)}`, tests }
    }

    const failed = tests.filter((t) => t.status === 'failed')
    return failed.length === 0
      ? { status: 'passed', tests }
      : { status: 'failed', reason: `Fallan: ${failed.map((t) => t.title).join(', ')}`, tests }
  },
}
