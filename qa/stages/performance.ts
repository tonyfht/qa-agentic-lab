import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import {
  fromK6Summary,
  fromLighthouseReport,
  lighthouseProblems,
  loadProblems,
  type LighthousePage,
  type LoadResult,
} from '../lib/budgets'
import { E2E_DATABASE_URL, E2E_PORT, resetE2eDatabase } from '../lib/e2e'
import { commandExists, killTree, runCommand, startBackground, tail } from '../lib/exec'
import { retryToolError } from '../lib/retry'
import type { TestResult } from '../results/schema'
import type { StageDefinition } from './types'

export const LIGHTHOUSE_PAGES = ['/', '/catalogo', '/producto/mantel-antimanchas']
const LOAD_DURATION_S = 30
export const K6_INSTALL_HINT =
  'k6 no está instalado: winget install k6 (Windows), brew install k6 (macOS) o https://grafana.com/docs/k6/latest/set-up/install-k6/'

async function waitFor(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return true
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

const test = (id: string, title: string, requirements: string[], status: TestResult['status'], durationMs: number, message?: string): TestResult => ({
  id,
  title,
  file: '',
  stage: 'performance',
  status,
  durationMs,
  retries: 0,
  requirements,
  tags: [requirements.includes('EXP-005') ? '@load' : '@performance'],
  ...(message ? { message } : {}),
})

/** Lighthouse (EXP-004) and k6 (EXP-005) against the store started on this machine (QA-019). */
export const performanceStage: StageDefinition = {
  id: 'performance',
  name: 'Rendimiento y carga',
  blocking: true,
  dependsOn: ['build'],
  async run(ctx) {
    resetE2eDatabase(ctx.root)
    const base = `http://localhost:${E2E_PORT}`
    const server = startBackground(`npx next start -p ${E2E_PORT}`, ctx.root, { DATABASE_URL: E2E_DATABASE_URL })
    const tests: TestResult[] = []
    const lighthouse: LighthousePage[] = []
    let load: LoadResult | undefined
    try {
      if (!(await waitFor(`${base}/api/health`, 60_000))) {
        return { status: 'failed', reason: `La tienda no arrancó en el puerto ${E2E_PORT}` }
      }

      const chromePath = chromium.executablePath()
      for (const page of LIGHTHOUSE_PAGES) {
        ctx.log(`  · Lighthouse ${page}`)
        const started = Date.now()
        const out = path.join(ctx.runDir, `lighthouse-${page.replace(/\W+/g, '_') || 'home'}.json`)
        const outcome = await retryToolError<LighthousePage>(async () => {
          rmSync(out, { force: true })
          const { code, output } = await runCommand(
            `npx lighthouse "${base}${page}" --chrome-path="${chromePath}" --chrome-flags="--headless=new --no-sandbox" ` +
              `--preset=desktop --only-categories=performance,accessibility,best-practices,seo ` +
              `--output=json --output-path="${out}" --quiet`,
            { cwd: ctx.root, quiet: true },
          )
          return code !== 0 || !existsSync(out)
            ? { ok: false, error: `Lighthouse falló:\n${tail(output)}` }
            : { ok: true, value: fromLighthouseReport(page, JSON.parse(readFileSync(out, 'utf8'))) }
        })
        const title = `Presupuesto de rendimiento: ${page}`
        if (!outcome.value) {
          tests.push(test(`lh-${page}`, title, ['EXP-004', 'QA-035'], 'failed', Date.now() - started, outcome.error ?? undefined))
          continue
        }
        lighthouse.push(outcome.value)
        const problems = lighthouseProblems(outcome.value)
        // A budget miss fails; a run that only measured on the retry is flaky, with the tool error kept (QA-035).
        const status = problems.length ? 'failed' : outcome.firstError ? 'flaky' : 'passed'
        const message = problems.join('; ') || (outcome.firstError ? `Reintentado tras un error de la herramienta. ${outcome.firstError}` : undefined)
        tests.push({
          ...test(`lh-${page}`, title, outcome.firstError ? ['EXP-004', 'QA-035'] : ['EXP-004'], status, Date.now() - started, message),
          retries: outcome.firstError ? 1 : 0,
        })
      }

      const started = Date.now()
      if (!commandExists('k6')) {
        tests.push(test('load', 'Prueba de carga: 20 usuarios durante 30 s', ['EXP-005'], 'skipped', 0, K6_INSTALL_HINT))
      } else {
        ctx.log('  · Prueba de carga (k6)')
        const summary = path.join(ctx.runDir, 'k6-summary.json')
        const { output } = await runCommand(
          `k6 run --quiet --summary-export "${summary}" -e BASE_URL=${base} tests/load/tienda.js`,
          { cwd: ctx.root, quiet: true },
        )
        if (!existsSync(summary)) {
          tests.push(test('load', 'Prueba de carga: 20 usuarios durante 30 s', ['EXP-005'], 'failed', Date.now() - started, `k6 no produjo resumen:\n${tail(output)}`))
        } else {
          load = fromK6Summary(JSON.parse(readFileSync(summary, 'utf8')), LOAD_DURATION_S)
          const problems = loadProblems(load)
          tests.push(
            test('load', 'Prueba de carga: 20 usuarios durante 30 s', ['EXP-005'], problems.length ? 'failed' : 'passed', Date.now() - started, problems.join('; ') || undefined),
          )
        }
      }
    } finally {
      killTree(server)
    }

    const failed = tests.filter((t) => t.status === 'failed')
    return {
      status: failed.length ? 'failed' : 'passed',
      reason: failed.length ? failed.map((t) => `${t.title}: ${t.message}`).join(' | ') : undefined,
      tests,
      metrics: { lighthouse, ...(load ? { load } : {}) },
    }
  },
}
