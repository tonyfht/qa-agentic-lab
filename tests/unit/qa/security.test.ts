import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { blockingFindings, checkLicenses, fromNpmAudit, fromSemgrep, fromZap, licenseAllowed } from '@/qa/security/findings'

const root = path.resolve(__dirname, '../../..')

describe('SEC-002 Análisis estático de seguridad', () => {
  it('normaliza Semgrep: ERROR es alto, WARNING medio, INFO bajo, con regla, fichero y línea', () => {
    const findings = fromSemgrep({
      results: [
        { check_id: 'javascript.lang.security.detect-eval', path: 'lib\\x.ts', start: { line: 7 }, extra: { severity: 'ERROR', message: 'eval detectado\nmás' } },
        { check_id: 'a.b.weak', path: 'lib/y.ts', start: { line: 2 }, extra: { severity: 'WARNING', message: 'w' } },
      ],
    })
    expect(findings[0]).toEqual({ source: 'semgrep', severity: 'high', title: 'detect-eval: eval detectado', location: 'lib/x.ts:7' })
    expect(findings[1].severity).toBe('medium')
    expect(blockingFindings(findings)).toHaveLength(1)
  })
})

describe('SEC-003 Dependencias sin vulnerabilidades graves', () => {
  it('distingue producción de desarrollo: solo bloquea lo de producción', () => {
    const all = { vulnerabilities: { braces: { name: 'braces', severity: 'high' }, next: { name: 'next', severity: 'critical' } } }
    const prod = { vulnerabilities: { next: { name: 'next', severity: 'critical' } } }
    const findings = fromNpmAudit(all, prod)
    expect(findings.map((x) => [x.location, x.scope, x.severity])).toEqual([
      ['npm:braces', 'development', 'high'],
      ['npm:next', 'production', 'critical'],
    ])
    expect(blockingFindings(findings).map((x) => x.location)).toEqual(['npm:next'])
  })

  it('"moderate" de npm es gravedad media', () => {
    expect(fromNpmAudit({ vulnerabilities: { a: { name: 'a', severity: 'moderate' } } }, {})[0].severity).toBe('medium')
  })
})

describe('SEC-004 Análisis dinámico pasivo', () => {
  const zap = {
    site: [
      {
        alerts: [
          { pluginid: '10055', alert: 'CSP: script-src unsafe-inline', riskcode: '2', instances: [{ uri: 'http://localhost:3410/' }] },
          { pluginid: '10038', alert: 'CSP Header Not Set', riskcode: '2' },
          { pluginid: '10096', alert: 'Timestamp Disclosure', riskcode: '0' },
        ],
      },
    ],
  }

  it('una alerta media sin aceptar bloquea; aceptada con motivo, no', () => {
    const findings = fromZap(zap, [{ pluginid: '10055', alerta: 'CSP: script-src unsafe-inline', motivo: 'Next.js emite scripts en línea' }])
    expect(findings[0]).toMatchObject({ severity: 'medium', accepted: 'Next.js emite scripts en línea', location: 'http://localhost:3410/' })
    expect(blockingFindings(findings).map((x) => x.title)).toEqual(['CSP Header Not Set [10038]'])
  })

  it('las alertas informativas nunca bloquean', () => {
    expect(blockingFindings(fromZap(zap, [])).some((x) => x.title.startsWith('Timestamp'))).toBe(false)
  })
})

describe('CMP-001 Licencias permitidas', () => {
  const policy = JSON.parse(readFileSync(path.join(root, 'compliance/licencias.json'), 'utf8'))

  it('evalúa expresiones SPDX con AND y OR', () => {
    expect(licenseAllowed('MIT', policy.permitidas)).toBe(true)
    expect(licenseAllowed('(MIT OR GPL-3.0)', policy.permitidas)).toBe(true)
    expect(licenseAllowed('Apache-2.0 AND LGPL-3.0-or-later', policy.permitidas)).toBe(false)
    expect(licenseAllowed('', policy.permitidas)).toBe(false)
  })

  it('una licencia no permitida sin excepción bloquea nombrando el paquete', () => {
    const findings = checkLicenses([{ name: 'copyleft-lib', version: '1.0.0', license: 'GPL-3.0' }], policy)
    expect(blockingFindings(findings)).toEqual([expect.objectContaining({ title: 'Licencia GPL-3.0 de copyleft-lib@1.0.0' })])
  })

  it('la excepción de sharp (libvips, LGPL) se acepta con su motivo en cualquier plataforma', () => {
    for (const name of ['@img/sharp-win32-x64', '@img/sharp-libvips-linux-x64']) {
      const [finding] = checkLicenses([{ name, version: '0.35.5', license: 'Apache-2.0 AND LGPL-3.0-or-later' }], policy)
      expect(finding.accepted).toMatch(/libvips/)
      expect(blockingFindings([finding])).toEqual([])
    }
  })

  it('una licencia vacía es desconocida y bloquea', () => {
    expect(blockingFindings(checkLicenses([{ name: 'x', version: '1', license: '' }], policy))[0].title).toBe('Licencia desconocida de x@1')
  })
})
