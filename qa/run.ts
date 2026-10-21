import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { reportLink, resolveRunId, runDirFor } from './lib/context'
import { resolveInjection, UnknownDefectError } from './lib/inject'
import { executePlan, planStages, renderSummary, runFailed, UnknownStageError } from './orchestrator'
import type { RunResult } from './results/schema'
import { registry } from './stages/registry'

// Usage: npm run qa [-- --stage <id>] [--inject <defecto>] [--<option> <value>]
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
  const { stage: target, inject, ...options } = parseArgs(process.argv.slice(2))

  // The store and every server the stages start inherit the variable (QA-029).
  try {
    const defect = resolveInjection(inject, process.env)
    if (defect) process.env.QA_INJECT_DEFECT = defect
    else delete process.env.QA_INJECT_DEFECT
  } catch (error) {
    if (error instanceof UnknownDefectError) {
      console.error(error.message)
      process.exit(2)
    }
    throw error
  }

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
  const previous = existsSync(meta) ? JSON.parse(readFileSync(meta, 'utf8')) : { startedAt: new Date().toISOString() }
  // A stage run alone with --inject marks the whole run, so a later `--stage report` still knows (QA-029). The mark
  // stays until a full `npm run qa` starts a new run: a possibly tainted run never enters the history.
  const injectedDefect = process.env.QA_INJECT_DEFECT ?? previous.injectedDefect
  writeFileSync(meta, JSON.stringify({ ...previous, ...(injectedDefect ? { injectedDefect } : {}) }))

  const injected = process.env.QA_INJECT_DEFECT ? ` · defecto inyectado: ${process.env.QA_INJECT_DEFECT}` : ''
  console.log(`QA Agentic Lab · ejecución ${runId} · etapas: ${plan.map((s) => s.id).join(' → ')}${injected}\n`)
  const partials = await executePlan(plan, { root, runId, runDir, options, log: console.log }, target)

  const stages = partials.map((p) => p.stage)
  // After the report stage the summary covers the whole run (in CI, the stages ran in other jobs).
  const runFile = path.join(runDir, 'run.json')
  const whole =
    (!target || target === 'report') && existsSync(runFile)
      ? (JSON.parse(readFileSync(runFile, 'utf8')) as RunResult)
      : null
  const summary = renderSummary(
    whole?.stages ?? stages,
    whole?.tests ?? partials.flatMap((p) => p.tests),
    reportLink(root),
  )
  console.log('\n' + summary)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)

  process.exit(runFailed(stages) ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
