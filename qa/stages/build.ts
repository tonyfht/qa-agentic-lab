import { existsSync } from 'node:fs'
import path from 'node:path'
import { E2E_DATABASE_URL, E2E_PORT, resetE2eDatabase } from '../lib/e2e'
import { killTree, runCommand, startBackground, tail } from '../lib/exec'
import type { StageDefinition } from './types'



async function waitForHealth(url: string, timeoutMs: number): Promise<{ ok: boolean; body?: unknown }> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return { ok: true, body: await res.json() }
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return { ok: false }
}

/** Builds the store and checks it boots and answers its health check on the E2E port (QA-001). */
export const buildStage: StageDefinition = {
  id: 'build',
  name: 'Tienda en el runner',
  blocking: true,
  dependsOn: [],
  // In CI the e2e job downloads the build of the build job instead of rebuilding.
  isSatisfied: (ctx) => process.env.QA_REUSE_BUILD === '1' && existsSync(path.join(ctx.root, '.next', 'BUILD_ID')),
  async run(ctx) {
    const build = await runCommand('npx next build', { cwd: ctx.root })
    if (build.code !== 0) return { status: 'failed', reason: `La build falló:\n${tail(build.output)}` }

    resetE2eDatabase(ctx.root)
    const started = Date.now()
    const server = startBackground(`npx next start -p ${E2E_PORT}`, ctx.root, { DATABASE_URL: E2E_DATABASE_URL })
    try {
      const health = await waitForHealth(`http://localhost:${E2E_PORT}/api/health`, 60_000)
      const ok = health.ok && (health.body as { status?: string })?.status === 'ok'
      return {
        status: ok ? 'passed' : 'failed',
        reason: ok ? undefined : `La tienda no respondió a /api/health en el puerto ${E2E_PORT}`,
        tests: [
          {
            id: 'build-health',
            title: 'La tienda arranca y responde a /api/health',
            file: '',
            stage: 'build',
            status: ok ? 'passed' : 'failed',
            durationMs: Date.now() - started,
            retries: 0,
            requirements: ['QA-001'],
            tags: ['@build'],
          },
        ],
      }
    } finally {
      killTree(server)
    }
  },
}
