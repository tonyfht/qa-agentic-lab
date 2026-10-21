import { describe, expect, it } from 'vitest'
import { fromK6Summary, fromLighthouseReport, lighthouseProblems, loadProblems, type LighthousePage } from '@/qa/lib/budgets'

const good: LighthousePage = { page: '/', performance: 100, accessibility: 100, bestPractices: 96, seo: 100, lcpMs: 430, cls: 0, tbtMs: 0 }

describe('EXP-004 Presupuesto de rendimiento', () => {
  it('una página dentro del presupuesto no tiene problemas', () => {
    expect(lighthouseProblems(good)).toEqual([])
  })

  it.each([
    [{ performance: 84 }, 'Rendimiento 84 < 85'],
    [{ performance: 85 }, null],
    [{ accessibility: 89 }, 'Accesibilidad 89 < 90'],
    [{ bestPractices: 89 }, 'Buenas prácticas 89 < 90'],
    [{ seo: 89 }, 'SEO 89 < 90'],
    [{ lcpMs: 2500 }, null],
    [{ lcpMs: 3100 }, 'LCP 3,1 s > 2,5 s'],
    [{ cls: 0.1 }, null],
    [{ cls: 0.15 }, 'CLS 0,15 > 0,1'],
    [{ tbtMs: 301 }, 'TBT 301 ms > 300 ms'],
  ])('%o → %s (valores límite)', (change, problem) => {
    expect(lighthouseProblems({ ...good, ...change })).toEqual(problem ? [problem] : [])
  })

  it('convierte el informe de Lighthouse (puntuaciones de 0 a 1) a 0–100', () => {
    const r = fromLighthouseReport('/catalogo', {
      categories: { performance: { score: 0.97 }, accessibility: { score: 1 }, 'best-practices': { score: 0.96 }, seo: { score: null } },
      audits: {
        'largest-contentful-paint': { numericValue: 433.7 },
        'cumulative-layout-shift': { numericValue: 0.00012 },
        'total-blocking-time': { numericValue: 12.4 },
      },
    })
    expect(r).toEqual({ page: '/catalogo', performance: 97, accessibility: 100, bestPractices: 96, seo: 0, lcpMs: 434, cls: 0, tbtMs: 12 })
  })
})

describe('EXP-005 Comportamiento con carga', () => {
  const ok = { p95Ms: 120, errorRate: 0, requests: 1800, vus: 20, durationS: 30 }

  it('dentro de los umbrales no hay problemas', () => {
    expect(loadProblems(ok)).toEqual([])
  })

  it('el p95 y los errores se comparan con su umbral (estrictamente menor)', () => {
    expect(loadProblems({ ...ok, p95Ms: 800 })).toEqual(['p95 800 ms ≥ 500 ms'])
    expect(loadProblems({ ...ok, p95Ms: 499 })).toEqual([])
    expect(loadProblems({ ...ok, errorRate: 0.01 })).toEqual(['errores 1 % ≥ 1 %'])
  })

  it('lee el resumen exportado por k6', () => {
    const r = fromK6Summary(
      {
        metrics: {
          http_req_duration: { 'p(95)': 87.6 },
          http_req_failed: { value: 0.002 },
          http_reqs: { count: 1740 },
          vus_max: { value: 20 },
        },
      },
      30,
    )
    expect(r).toEqual({ p95Ms: 88, errorRate: 0.002, requests: 1740, vus: 20, durationS: 30 })
  })
})
