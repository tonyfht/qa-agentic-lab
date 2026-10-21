import type { Finding } from '../results/schema'

/**
 * Blocking rule (SEC-002…004, CMP-001): anything accepted with a reason never blocks; development dependencies never
 * block; otherwise critical/high always block, and so do ZAP medium alerts and any licence problem.
 */
export function blockingFindings(findings: Finding[]): Finding[] {
  return findings.filter((f) => {
    if (f.accepted || f.scope === 'development') return false
    if (f.severity === 'critical' || f.severity === 'high') return true
    if (f.source === 'zap' && f.severity === 'medium') return true
    return f.source === 'licenses'
  })
}

// Semgrep --json
type SemgrepJson = { results: { check_id: string; path: string; start: { line: number }; extra: { severity: string; message: string } }[] }
const SEMGREP_SEVERITY: Record<string, Finding['severity']> = { ERROR: 'high', WARNING: 'medium', INFO: 'low' }

export function fromSemgrep(json: SemgrepJson): Finding[] {
  return json.results.map((r) => ({
    source: 'semgrep',
    severity: SEMGREP_SEVERITY[r.extra.severity] ?? 'low',
    title: `${r.check_id.split('.').pop()}: ${r.extra.message.split('\n')[0]}`,
    location: `${r.path.split('\\').join('/')}:${r.start.line}`,
  }))
}

// npm audit --json (v2)
type NpmAuditJson = { vulnerabilities?: Record<string, { name: string; severity: string; range?: string }> }
const NPM_SEVERITY: Record<string, Finding['severity']> = { critical: 'critical', high: 'high', moderate: 'medium', low: 'low', info: 'info' }

/** Every vulnerable package; those also present in the production audit are scoped "production". */
export function fromNpmAudit(all: NpmAuditJson, production: NpmAuditJson): Finding[] {
  const prod = new Set(Object.keys(production.vulnerabilities ?? {}))
  return Object.values(all.vulnerabilities ?? {}).map((v) => ({
    source: 'npm-audit',
    severity: NPM_SEVERITY[v.severity] ?? 'info',
    title: `${v.name} vulnerable${v.range ? ` (${v.range})` : ''}`,
    location: `npm:${v.name}`,
    scope: prod.has(v.name) ? 'production' : 'development',
  }))
}

// OWASP ZAP baseline -J
type ZapJson = { site?: { alerts?: { pluginid: string; alert: string; riskcode: string; instances?: { uri: string }[] }[] }[] }
const ZAP_SEVERITY: Record<string, Finding['severity']> = { '3': 'high', '2': 'medium', '1': 'low', '0': 'info' }
export type ZapAccepted = { pluginid: string; alerta: string; motivo: string }[]

export function fromZap(json: ZapJson, accepted: ZapAccepted): Finding[] {
  return (json.site ?? []).flatMap((s) =>
    (s.alerts ?? []).map((a) => {
      const ok = accepted.find((x) => x.pluginid === a.pluginid)
      return {
        source: 'zap' as const,
        severity: ZAP_SEVERITY[a.riskcode] ?? 'info',
        title: `${a.alert} [${a.pluginid}]`,
        location: a.instances?.[0]?.uri,
        ...(ok ? { accepted: ok.motivo } : {}),
      }
    }),
  )
}

// Licences (CMP-001)
export interface LicensePolicy {
  permitidas: string[]
  excepciones: { paquete: string; licencia: string; motivo: string }[]
}
export interface InstalledPackage {
  name: string
  version: string
  license: string
}

const globMatch = (pattern: string, name: string) =>
  new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`).test(name)

/** SPDX expression check: with OR one allowed licence is enough, with AND every licence must be allowed. */
export function licenseAllowed(expression: string, allowed: string[]): boolean {
  const clean = expression.replace(/[()]/g, '').trim()
  if (!clean) return false
  if (/\sOR\s/.test(clean)) return clean.split(/\s+OR\s+/).some((l) => licenseAllowed(l, allowed))
  return clean.split(/\s+AND\s+/).every((l) => allowed.includes(l.trim()))
}

export function checkLicenses(packages: InstalledPackage[], policy: LicensePolicy): Finding[] {
  return packages.flatMap((p) => {
    if (licenseAllowed(p.license, policy.permitidas)) return []
    const exception = policy.excepciones.find((e) => globMatch(e.paquete, p.name) && p.license.includes(e.licencia))
    return [
      {
        source: 'licenses' as const,
        severity: 'medium' as const,
        title: `Licencia ${p.license || 'desconocida'} de ${p.name}@${p.version}`,
        location: `npm:${p.name}`,
        scope: 'production' as const,
        ...(exception ? { accepted: exception.motivo } : {}),
      },
    ]
  })
}
