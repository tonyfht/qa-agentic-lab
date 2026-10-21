import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect } from '@playwright/test'
import { buildSite } from '../../report/build'
import type { RunResult, TestResult } from '../../qa/results/schema'
import { withTriage } from '../../qa/triage/classify'
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

Given('un histórico cuya última ejecución tiene actuaciones de agentes', async ({ world }) => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'qal-report-'))
  const action = {
    date: '2026-10-21T10:00:00.000Z',
    change: 'catalog',
    artifacts: ['qa/agents/reviews/catalog.md'],
    executedBy: 'prueba',
  }
  const last = sampleRun({
    runId: 'run-2',
    origin: { kind: 'ci', runNumber: 2 },
    agentActions: [
      { ...action, agent: 'revisor-specs', action: 'revisión de especificación', summary: '6 hallazgos' },
      { ...action, agent: 'disenador', action: 'diseño de casos (pairwise)', summary: '9 filas' },
    ],
  })
  world.reportIndex = buildSite({ root, history: [...runs(1), last], outDir })
})

Then('veo la actuación {string}', async ({ page }, text: string) => {
  await expect(page.getByTestId('agents').getByText(text)).toBeVisible()
})

Then('la sección de agentes explica que todavía no hay actuaciones', async ({ page }) => {
  await expect(page.getByTestId('agents-empty')).toHaveText('Todavía no hay actuaciones de agentes registradas.')
  await expect(page.getByTestId('agents-chart-empty')).toBeVisible()
})

Given('un histórico cuya última ejecución tiene métricas de rendimiento y carga', async ({ world }) => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'qal-report-'))
  const page = { performance: 98, accessibility: 100, bestPractices: 96, seo: 100, lcpMs: 450, cls: 0, tbtMs: 0 }
  const last = sampleRun({
    runId: 'run-2',
    origin: { kind: 'ci', runNumber: 2 },
    metrics: {
      lighthouse: [
        { page: '/', ...page },
        { page: '/catalogo', ...page },
      ],
      load: { p95Ms: 120, errorRate: 0, requests: 1800, vus: 20, durationS: 30 },
    },
  })
  world.reportIndex = buildSite({ root, history: [...runs(1), last], outDir })
})

Then('la experiencia muestra un p95 de {string}', async ({ page }, value: string) => {
  await expect(page.locator('#exp-kpis').getByText(value, { exact: true })).toBeVisible()
})

Then('la sección de experiencia explica que no hay métricas de rendimiento', async ({ page }) => {
  await expect(page.getByTestId('experience-empty')).toContainText('No hay métricas de rendimiento')
})

Given('un histórico cuya última ejecución tiene hallazgos de seguridad', async ({ world }) => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'qal-report-'))
  const last = sampleRun({
    runId: 'run-2',
    origin: { kind: 'ci', runNumber: 2 },
    stages: [{ id: 'security', name: 'Seguridad y cumplimiento', blocking: true, status: 'passed', durationMs: 1000 }],
    findings: [
      { source: 'zap', severity: 'medium', title: 'CSP: script-src unsafe-inline [10055]', accepted: 'Next.js emite scripts en línea' },
      { source: 'npm-audit', severity: 'high', title: 'braces vulnerable', scope: 'development' },
    ],
    metrics: { sbom: { format: 'CycloneDX', components: 42, file: 'sbom.cdx.json' } },
  })
  world.reportIndex = buildSite({ root, history: [...runs(1), last], outDir })
})

Then('veo la excepción aceptada {string} con su motivo', async ({ page }, title: string) => {
  const row = page.getByTestId('security').getByRole('row').filter({ hasText: title })
  await expect(row).toContainText('Next.js emite scripts en línea')
})

// QA-053: one test needs a retry in two of three runs.
Given('un histórico en el que un test fue inestable en 2 de 3 ejecuciones', async ({ world }) => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'qal-report-'))
  const cart = (status: TestResult['status']): TestResult => ({
    id: 'cart-1',
    title: 'Carrito › Se conserva al recargar',
    file: 'tests/features/cart/carrito.feature',
    stage: 'e2e',
    status,
    durationMs: 900,
    retries: status === 'flaky' ? 1 : 0,
    requirements: ['QA-001'],
    tags: ['@QA-001', '@e2e'],
  })
  const history = (['flaky', 'passed', 'flaky'] as const).map((status, i) =>
    sampleRun({ runId: `run-${i + 1}`, origin: { kind: 'ci', runNumber: i + 1 }, tests: [cart(status)] }),
  )
  world.reportIndex = buildSite({ root, history, outDir })
})

Then('el test {string} aparece como inestable {string}', async ({ page }, title: string, times: string) => {
  const row = page.getByTestId('stability').getByRole('row').filter({ hasText: title })
  await expect(row).toContainText(times)
})

Then('la sección de estabilidad dice que ningún test ha sido inestable', async ({ page }) => {
  await expect(page.getByTestId('stability-empty')).toContainText('Ningún test ha sido inestable en las últimas 2 ejecuciones')
})

// QA-054: a demo run with the `cupon` defect, triaged by the real rules.
Given('una ejecución con el defecto {string} inyectado, un fallo de producto y uno de test', async ({ world }, defect: string) => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'qal-report-'))
  const failed = (id: string, title: string, message: string): TestResult => ({
    id,
    title,
    file: 'tests/features/x.feature',
    stage: 'e2e',
    status: 'failed',
    durationMs: 500,
    retries: 1,
    requirements: ['QA-001'],
    tags: ['@QA-001'],
    message,
  })
  const last = sampleRun({
    runId: 'run-2',
    status: 'failed',
    origin: { kind: 'ci', runNumber: 2 },
    injectedDefect: defect,
    tests: withTriage([
      failed('p', 'Cupones › Un cupón válido descuenta', 'expect(received).toBe(expected)\n\nExpected: 200\nReceived: 400'),
      failed('t', 'Filtros › Filtrar por categoría', "Locator: getByTestId('results-total')\nError: element(s) not found"),
    ]),
  })
  world.reportIndex = buildSite({ root, history: [...runs(1), last], outDir })
})

Then('el aviso de demostración nombra el defecto {string}', async ({ page }, defect: string) => {
  await expect(page.getByTestId('demo-banner')).toBeVisible()
  await expect(page.getByTestId('demo-banner')).toContainText(`con el defecto ${defect} inyectado`)
})

Then('el fallo {string} aparece como {string}', async ({ page }, title: string, category: string) => {
  const row = page.getByTestId('operations').getByRole('row').filter({ hasText: title })
  await expect(row).toContainText(category)
})

Then('la sección de seguridad explica que no hay resultados', async ({ page }) => {
  await expect(page.getByTestId('security-empty')).toContainText('No hay resultados de seguridad')
})
