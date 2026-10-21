import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { reportLink, resolveRunId, runDirFor } from './lib/context'
import { executePlan, planStages, renderSummary, runFailed, UnknownStageError } from './orchestrator'
import { registry } from './stages/registry'

// Usage: npm run qa [-- --stage <id>] [--<option> <value>]
function parseArgs(argv: string[]) {
  const options: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const next = argv[i + 1]
    options[arg.slice(2)] = next && !next.startsWith('--') ? (i++, next) : 'true'
  }
  return options
}

async function main() {
  const root = process.cwd()
  const { stage: target, ...options } = parseArgs(process.argv.slice(2))

  let plan
  try {
    plan = planStages(registry, target)
  } catch (error) {
    if (error instanceof UnknownStageError) {
      console.error(error.message)
      process.exit(2)
    }
    throw error
  }

  const runId = resolveRunId(root, Boolean(target))
  const runDir = runDirFor(root, runId)
  mkdirSync(runDir, { recursive: true })
  const meta = path.join(runDir, 'meta.json')
  if (!existsSync(meta)) writeFileSync(meta, JSON.stringify({ startedAt: new Date().toISOString() }))

  console.log(`QA Agentic Lab · ejecución ${runId} · etapas: ${plan.map((s) => s.id).join(' → ')}\n`)
  const partials = await executePlan(plan, { root, runId, runDir, options, log: console.log }, target)

  const stages = partials.map((p) => p.stage)
  const summary = renderSummary(stages, partials.flatMap((p) => p.tests), reportLink(root))
  console.log('\n' + summary)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)

  process.exit(runFailed(stages) ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
