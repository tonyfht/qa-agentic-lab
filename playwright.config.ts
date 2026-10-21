import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'
import { E2E_DATABASE_URL, E2E_PORT } from './qa/lib/e2e'
const runDir = process.env.QA_RUN_DIR ?? path.join('reports', 'runs', 'adhoc')

const testDir = defineBddConfig({
  features: 'tests/features/**/*.feature',
  steps: 'tests/steps/**/*.ts',
  outputDir: '.features-gen',
})

export default defineConfig({
  testDir,
  // Same settings locally and in CI so both produce the same result (RT-2). One retry exposes flaky tests.
  retries: 1,
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  // Fixed, not per CPU: the same parallelism on a 20-core laptop and on a 4-core CI runner (RT-2).
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(runDir, 'playwright-report'), open: 'never' }],
    ['./tests/support/run-result-reporter.ts', { outputFile: path.join(runDir, 'e2e-tests.json') }],
  ],
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next start -p ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: E2E_DATABASE_URL },
  },
})
