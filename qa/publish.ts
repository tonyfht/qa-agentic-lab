import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildSite } from '../report/build'
import { appendRun, readHistory } from './results/history'

/**
 * CI only, after the report job on main (QA-013): appends the run to the public history in the gh-pages checkout
 * and rebuilds the published site there. The workflow serialises this step so two runs never overwrite each other.
 *
 * Usage: tsx qa/publish.ts <gh-pages checkout> <run dir with run.json>
 */
const [pagesDir, runDir] = process.argv.slice(2)
if (!pagesDir || !runDir) {
  console.error('Uso: tsx qa/publish.ts <checkout de gh-pages> <directorio de la ejecución>')
  process.exit(2)
}

const historyFile = path.join(pagesDir, 'history', 'runs.ndjson')
const run = JSON.parse(readFileSync(path.join(runDir, 'run.json'), 'utf8'))
// Second line of defence after the workflow condition: a demo run with an injected defect is never public history.
if (run.injectedDefect) {
  console.log(`La ejecución ${run.runId} tiene el defecto «${run.injectedDefect}» inyectado; no se publica.`)
  process.exit(0)
}
if (readHistory(historyFile).some((r) => r.runId === run.runId)) {
  console.log(`La ejecución ${run.runId} ya estaba publicada; no se duplica.`)
} else {
  appendRun(historyFile, run)
}

const history = readHistory(historyFile)
buildSite({ root: process.cwd(), history, outDir: pagesDir, runDir })
// GitHub Pages must serve the folders as they are (no Jekyll processing).
writeFileSync(path.join(pagesDir, '.nojekyll'), '')
console.log(`Publicado: ${history.length} ejecuciones en el histórico.`)
