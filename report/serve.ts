import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { historyFile, siteDir } from '../qa/lib/context'
import { readHistory } from '../qa/results/history'
import { buildSite } from './build'

export const REPORT_PORT = 3420

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.zip': 'application/zip',
  '.webm': 'video/webm',
}

// `npm run report`: rebuilds the report from the local history and serves it (QA-015).
const root = process.cwd()
const history = readHistory(historyFile(root))
if (history.length === 0) {
  console.error('No hay ejecuciones en el histórico local. Ejecuta `npm run qa` primero.')
  process.exit(1)
}
const outDir = siteDir(root)
buildSite({ root, history, outDir })

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split(/[?#]/)[0])
  let file = path.normalize(path.join(outDir, urlPath))
  if (!file.startsWith(outDir)) {
    res.writeHead(403).end()
    return
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!existsSync(file)) {
    res.writeHead(404).end('No encontrado')
    return
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(REPORT_PORT, () => {
  console.log(`Informe con ${history.length} ejecución(es) en http://localhost:${REPORT_PORT}`)
})
