import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect } from '@playwright/test'
import { buildSite } from '../../report/build'
import type { RunResult, TestResult } from '../../qa/results/schema'
import { sampleRun } from '../support/sample-runs'
import { Given, Then, When } from './fixtures'

const root = process.cwd()

function runs(count: number): RunResult[] {
  return Array.from({ length: count }, (_, i) =>
    sampleRun({ runId: `run-${i + 1}`, origin: { kind: 'ci', runNumber: i + 1 } }),
  )
}

function failingTest(withDetail: boolean): TestResult {
  return {
    id: 'failing-1',
    title: 'La portada muestra la marca',
    file: 'tests/features/quality/smoke.feature',
    stage: 'e2e',
    status: 'failed',
    durationMs: 900,
    retries: 1,
    requirements: ['QA-001'],
    tags: ['@QA-001', '@e2e'],
    message: 'expect(locator).toHaveText(expected) failed',
    ...(withDetail ? { detail: { kind: 'playwright-report', path: 'playwright-report/index.html#?testId=failing-1' } } : {}),
  }
}

Given('un histórico con {int} ejecución/ejecuciones', async ({ world }, count: number) => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'qal-report-'))
  world.reportIndex = buildSite({ root, history: runs(count), outDir })
})

Given(
  /^un histórico cuya última ejecución tiene un test fallido (con|sin) detalle técnico$/,
  async ({ world }, mode: string) => {
    const withDetail = mode === 'con'
    const outDir = mkdtempSync(path.join(os.tmpdir(), 'qal-report-'))
    const runDir = mkdtempSync(path.join(os.tmpdir(), 'qal-run-'))
    if (withDetail) {
      mkdirSync(path.join(runDir, 'playwright-report'))
      writeFileSync(path.join(runDir, 'playwright-report', 'index.html'), '<html><body>detalle</body></html>')
    }
    const last = sampleRun({ runId: 'run-3', status: 'failed', origin: { kind: 'ci', runNumber: 3 }, tests: [failingTest(withDetail)] })
    world.reportIndex = buildSite({ root, history: [...runs(2), last], outDir, runDir })
  },
)

When('abro el informe', async ({ page, world }) => {
  page.on('request', (req) => world.requests.push(req.url()))
  await page.goto(pathToFileURL(world.reportIndex!).href)
  await expect(page.getByRole('heading', { name: 'Trazabilidad' })).toBeVisible()
})

Then('veo la pregunta {string}', async ({ page }, question: string) => {
  await expect(page.getByText(question, { exact: true })).toBeVisible()
})

Then('cada gráfico tiene su tabla alternativa', async ({ page }) => {
  for (const id of ['chart-trend', 'chart-stages', 'chart-coverage']) {
    const section = page.getByTestId(id)
    await section.getByText('Ver como tabla').click()
    await expect(section.getByRole('table')).toBeVisible()
  }
})

Then('la tendencia explica que necesita al menos {int} ejecuciones', async ({ page }, min: number) => {
  await expect(page.getByTestId('trend-empty')).toContainText(`al menos ${min} ejecuciones`)
})

Then('la página no ha hecho ninguna petición fuera del disco', async ({ world }) => {
  expect(world.requests.length).toBeGreaterThan(0)
  expect(world.requests.filter((url) => !url.startsWith('file:'))).toEqual([])
})

Then('el test fallido muestra el enlace {string}', async ({ page }, text: string) => {
  const link = page.getByTestId('detail-link')
  await expect(link).toHaveText(text)
  await link.click()
  await expect(page.getByText('detalle')).toBeVisible()
})

Then('el test fallido indica que no hay detalle técnico', async ({ page }) => {
  await expect(page.getByTestId('no-detail')).toHaveText('sin detalle técnico disponible')
  await expect(page.getByTestId('detail-link')).toHaveCount(0)
})
