import { appendFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildSite } from '../../report/build'
import { activeDefect } from '../../lib/qa/defects'
import { gitInfo, historyFile, origin, reportLink, siteDir } from '../lib/context'
import { assembleRun, readRunMeta } from '../results/assemble'
import { appendRun, readHistory } from '../results/history'
import { triageMarkdown } from '../triage/report'
import { releaseVerdict, verdictMarkdown } from '../../report/verdict'
import type { StageDefinition } from './types'

/** Assembles the run, validates it, appends it to the history and regenerates the report (QA-010, QA-012, QA-015). */
export function createReportStage(registry: () => StageDefinition[]): StageDefinition {
  const stage: StageDefinition = {
    id: 'report',
    name: 'Informe',
    blocking: false,
    dependsOn: [],
    async run(ctx) {
      const started = Date.now()
      const run = assembleRun({
        root: ctx.root,
        runId: ctx.runId,
        runDir: ctx.runDir,
        registry: registry(),
        startedAt: readRunMeta(ctx.runDir)?.startedAt ?? new Date(started).toISOString(),
        self: { id: stage.id, name: stage.name, blocking: stage.blocking, status: 'passed', durationMs: 0 },
        origin: origin(),
        git: gitInfo(ctx.root),
        injectedDefect: activeDefect() ?? readRunMeta(ctx.runDir)?.injectedDefect ?? null,
      })
      // The report's own duration covers assembling and building the site.
      const history = historyFile(ctx.root)
      const self = run.stages[run.stages.length - 1]
      self.durationMs = Date.now() - started
      writeFileSync(path.join(ctx.runDir, 'run.json'), JSON.stringify(run, null, 2))
      // A run with an injected defect is shown but never enters the history (QA-029).
      if (!run.injectedDefect) appendRun(history, run)

      const site = siteDir(ctx.root)
      const shown = run.injectedDefect ? [...readHistory(history), run] : readHistory(history)

      // The recommendation (QA-037) and the triage (QA-052) go to the job summary in CI.
      const verdict = releaseVerdict(shown)
      const triage = triageMarkdown(run, reportLink(ctx.root))
      writeFileSync(path.join(ctx.runDir, 'triaje.md'), triage)
      ctx.log(`  · ¿Podemos salir? ${verdict.title}`)
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${verdictMarkdown(verdict)}\n${triage}`)

      buildSite({ root: ctx.root, history: shown, outDir: site, runDir: ctx.runDir })
      ctx.log(`  · Informe generado en ${site}`)
      return { status: 'passed' }
    },
  }
  return stage
}
