import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildSite, DETAIL_RETENTION } from '@/report/build'
import { sampleRun } from '../qa/results/fixtures'

const root = path.resolve(__dirname, '../../..')
const tmp = (p: string) => mkdtempSync(path.join(os.tmpdir(), p))

describe('QA-015 Mismo informe en local y en GitHub Pages', () => {
  it('genera un sitio autocontenido: index, datos y recursos locales', () => {
    const outDir = tmp('qal-site-')
    buildSite({ root, history: [sampleRun()], outDir })
    for (const f of ['index.html', 'data.js', 'assets/echarts.min.js', 'assets/report.js', 'assets/report.css', 'assets/logo.svg']) {
      expect(existsSync(path.join(outDir, f)), f).toBe(true)
    }
    expect(readFileSync(path.join(outDir, 'data.js'), 'utf8')).toMatch(/^window\.QAL_REPORT = \{/)
  })

  it('la página no pide nada a la red: solo rutas relativas', () => {
    const outDir = tmp('qal-site-')
    buildSite({ root, history: [sampleRun()], outDir })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).not.toMatch(/(src|href)="(https?:)?\/\//)
  })
})

describe('QA-016 Detalle técnico enlazado', () => {
  it('copia el informe de Playwright de la ejecución y poda las antiguas', () => {
    const outDir = tmp('qal-site-')
    const runDir = tmp('qal-run-')
    mkdirSync(path.join(runDir, 'playwright-report'))
    writeFileSync(path.join(runDir, 'playwright-report', 'index.html'), '<html></html>')

    const old = sampleRun({ runId: 'old' })
    mkdirSync(path.join(outDir, 'runs', 'old', 'playwright'), { recursive: true })
    const recent = Array.from({ length: DETAIL_RETENTION }, (_, i) => sampleRun({ runId: `r${i}` }))
    buildSite({ root, history: [old, ...recent], outDir, runDir })

    expect(existsSync(path.join(outDir, 'runs', `r${DETAIL_RETENTION - 1}`, 'playwright', 'index.html'))).toBe(true)
    expect(existsSync(path.join(outDir, 'runs', 'old'))).toBe(false)
  })
})
