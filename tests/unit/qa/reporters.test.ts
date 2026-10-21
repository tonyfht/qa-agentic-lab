import path from 'node:path'
import type { TestCase } from '@playwright/test/reporter'
import { describe, expect, it } from 'vitest'
import { fromVitestJson } from '@/qa/lib/vitest-results'
import { sourceFile, toTestResult } from '@/tests/support/run-result-reporter'

const root = path.resolve('/repo')

function fakeCase(outcome: ReturnType<TestCase['outcome']>, results: { duration: number; error?: string }[], tags: string[]) {
  return {
    id: 'abc123',
    title: 'La API responde',
    tags,
    location: { file: path.join(root, '.features-gen', 'tests', 'features', 'quality', 'smoke.feature.spec.js') },
    outcome: () => outcome,
    titlePath: () => ['', 'chromium', 'smoke.feature.spec.js', 'La tienda arranca', 'La API responde'],
    results: results.map((r) => ({ duration: r.duration, error: r.error ? { message: r.error } : undefined, attachments: [] })),
  } as unknown as TestCase
}

describe('QA-011 Trazabilidad de cada test', () => {
  it('toma los requisitos de las etiquetas Gherkin y muestra el .feature de origen', () => {
    const t = toTestResult(fakeCase('expected', [{ duration: 40 }], ['@QA-001', '@e2e', '@smoke']), root)
    expect(t).toMatchObject({
      requirements: ['QA-001'],
      file: 'tests/features/quality/smoke.feature',
      title: 'La tienda arranca › La API responde',
      status: 'passed',
    })
    expect(t.detail).toBeUndefined()
  })

  it('un test sin etiqueta de requisito queda sin trazar', () => {
    expect(toTestResult(fakeCase('expected', [{ duration: 1 }], ['@e2e']), root).requirements).toEqual([])
  })

  it('convierte el JSON de Vitest con los IDs del describe exterior', () => {
    const tests = fromVitestJson(
      {
        testResults: [
          {
            name: path.join(root, 'tests', 'unit', 'a.test.ts'),
            assertionResults: [
              { ancestorTitles: ['QA-001 / QA-005 Semántica', 'grupo'], title: 'caso', status: 'passed', duration: 3.4 },
              { ancestorTitles: ['Sin ID'], title: 'otro', status: 'failed', duration: 1, failureMessages: ['boom'] },
            ],
          },
        ],
      },
      root,
      'static',
    )
    expect(tests[0]).toMatchObject({ requirements: ['QA-001', 'QA-005'], file: 'tests/unit/a.test.ts', durationMs: 3, tags: ['@unit'] })
    expect(tests[1]).toMatchObject({ requirements: [], status: 'failed', message: 'boom' })
  })

  it('normaliza la ruta del fichero generado por playwright-bdd', () => {
    expect(sourceFile(path.join(root, '.features-gen', 'tests', 'features', 'x.feature.spec.js'), root)).toBe('tests/features/x.feature')
  })
})

describe('QA-005 Quality gate de la ejecución', () => {
  it('un test que pasa al reintentarlo consta como inestable, con su reintento y su detalle', () => {
    const t = toTestResult(fakeCase('flaky', [{ duration: 10, error: '\u001b[31mTimeout\u001b[39m' }, { duration: 12 }], ['@QA-001']), root)
    expect(t).toMatchObject({ status: 'flaky', retries: 1, durationMs: 22, message: 'Timeout' })
    expect(t.detail).toEqual({ kind: 'playwright-report', path: 'playwright-report/index.html#?testId=abc123' })
  })

  it('un test fallido lleva su mensaje sin códigos de color', () => {
    const t = toTestResult(fakeCase('unexpected', [{ duration: 5, error: '\u001b[2mexpect(received)\u001b[22m' }], ['@QA-001']), root)
    expect(t).toMatchObject({ status: 'failed', message: 'expect(received)' })
  })
})
