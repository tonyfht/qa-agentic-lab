import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const REPORTS_DIR = 'reports'

export function isCI(): boolean {
  return process.env.GITHUB_ACTIONS === 'true'
}

function git(args: string, root: string): string {
  try {
    return execSync(`git ${args}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

export function gitInfo(root: string) {
  return {
    sha: process.env.GITHUB_SHA ?? git('rev-parse HEAD', root),
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || git('rev-parse --abbrev-ref HEAD', root),
    dirty: isCI() ? false : git('status --porcelain', root) !== '',
  }
}

export function origin() {
  if (!isCI()) return { kind: 'local' as const }
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_RUN_NUMBER } = process.env
  return {
    kind: 'ci' as const,
    workflowRunUrl: `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`,
    runNumber: Number(GITHUB_RUN_NUMBER),
  }
}

/**
 * Run id shared by every stage of one run. CI jobs share it through QA_RUN_ID. Locally a full run starts a new id;
 * a single --stage reuses the latest one, so `--stage e2e` followed by `--stage report` reports on the same run.
 */
export function resolveRunId(root: string, singleStage: boolean): string {
  if (process.env.QA_RUN_ID) return process.env.QA_RUN_ID
  const latestFile = path.join(root, REPORTS_DIR, 'runs', 'LATEST')
  if (singleStage && existsSync(latestFile)) return readFileSync(latestFile, 'utf8').trim()
  const id = `local-${new Date().toISOString().replace(/[:.]/g, '-')}`
  mkdirSync(path.dirname(latestFile), { recursive: true })
  writeFileSync(latestFile, id)
  return id
}

export function runDirFor(root: string, runId: string): string {
  return path.join(root, REPORTS_DIR, 'runs', runId)
}

export function historyFile(root: string): string {
  return process.env.QA_HISTORY_FILE ?? path.join(root, REPORTS_DIR, 'history', 'runs.ndjson')
}

export function siteDir(root: string): string {
  return process.env.QA_SITE_DIR ?? path.join(root, REPORTS_DIR, 'site')
}

export function reportLink(root: string): string {
  return process.env.QA_REPORT_URL ?? path.join(siteDir(root), 'index.html')
}
