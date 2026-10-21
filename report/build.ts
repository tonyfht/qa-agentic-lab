import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import type { RunResult } from '../qa/results/schema'
import { buildModel } from './model'

// Resolved from the repo root: works the same under tsx, Vitest (ESM) and Playwright (CJS).
const require = createRequire(path.join(process.cwd(), 'package.json'))

/** Runs whose Playwright detail is kept in the site; the summarised history is never pruned. */
export const DETAIL_RETENTION = 30

export interface BuildSiteInput {
  root: string
  history: RunResult[]
  outDir: string
  /** Directory of the current run, whose Playwright report (if any) is copied into the site. */
  runDir?: string
}

function pruneDetail(outDir: string, history: RunResult[]) {
  const runsDir = path.join(outDir, 'runs')
  if (!existsSync(runsDir)) return
  const keep = new Set(history.slice(-DETAIL_RETENTION).map((r) => r.runId))
  for (const dir of readdirSync(runsDir)) if (!keep.has(dir)) rmSync(path.join(runsDir, dir), { recursive: true, force: true })
}

/**
 * Builds the static report (QA-014, QA-015): index.html + data.js + local assets, so it opens from disk with no
 * network. The same function serves `npm run report` and the GitHub Pages publication.
 */
export function buildSite({ root, history, outDir, runDir }: BuildSiteInput): string {
  const assets = path.join(outDir, 'assets')
  mkdirSync(assets, { recursive: true })
  const template = path.join(root, 'report', 'template')
  cpSync(path.join(template, 'index.html'), path.join(outDir, 'index.html'))
  cpSync(path.join(template, 'report.css'), path.join(assets, 'report.css'))
  cpSync(path.join(template, 'report.js'), path.join(assets, 'report.js'))
  cpSync(require.resolve('echarts/dist/echarts.min.js'), path.join(assets, 'echarts.min.js'))
  cpSync(path.join(root, 'docs', 'assets', 'logo.svg'), path.join(assets, 'logo.svg'))

  const current = history[history.length - 1]
  const playwright = runDir && path.join(runDir, 'playwright-report')
  if (current && playwright && existsSync(playwright)) {
    cpSync(playwright, path.join(outDir, 'runs', current.runId, 'playwright'), { recursive: true })
  }
  pruneDetail(outDir, history)

  const model = buildModel(history, (runId) => existsSync(path.join(outDir, 'runs', runId, 'playwright', 'index.html')))
  // A script (not JSON fetched at runtime) so file:// works without CORS issues.
  writeFileSync(path.join(outDir, 'data.js'), `window.QAL_REPORT = ${JSON.stringify(model)};\n`)
  return path.join(outDir, 'index.html')
}
