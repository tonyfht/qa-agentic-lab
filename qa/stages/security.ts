import { chmodSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { E2E_DATABASE_URL, E2E_PORT, resetE2eDatabase } from '../lib/e2e'
import { commandExists, killTree, runCommand, startBackground, tail } from '../lib/exec'
import type { Finding, TestResult } from '../results/schema'
import {
  blockingFindings,
  checkLicenses,
  fromNpmAudit,
  fromSemgrep,
  fromZap,
  type InstalledPackage,
  type LicensePolicy,
} from '../security/findings'
import type { StageContext, StageDefinition } from './types'

export const ZAP_IMAGE = 'ghcr.io/zaproxy/zaproxy:stable'

type Check = { status: TestResult['status']; findings: Finding[]; message?: string; metrics?: Record<string, unknown> }

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'))

async function sast(ctx: StageContext): Promise<Check> {
  if (!commandExists('semgrep')) return { status: 'skipped', findings: [], message: 'Semgrep no está instalado: pip install semgrep (o uv tool install semgrep)' }
  if (process.platform === 'win32') {
    return { status: 'skipped', findings: [], message: 'Semgrep no funciona en Windows (soporte beta de semgrep-core); se ejecuta en CI (Linux)' }
  }
  const out = path.join(ctx.runDir, 'semgrep.json')
  const { output } = await runCommand(
    `semgrep scan --config p/default --metrics=off --json --output "${out}" --exclude node_modules --exclude .next --exclude reports --exclude .features-gen --exclude openspec .`,
    { cwd: ctx.root, quiet: true },
  )
  if (!existsSync(out)) return { status: 'failed', findings: [], message: `Semgrep no produjo resultados:\n${tail(output)}` }
  return { status: 'passed', findings: fromSemgrep(readJson(out)) }
}

async function dependencies(ctx: StageContext): Promise<Check> {
  const all = await runCommand('npm audit --json', { cwd: ctx.root, quiet: true })
  const prod = await runCommand('npm audit --omit=dev --json', { cwd: ctx.root, quiet: true })
  try {
    return { status: 'passed', findings: fromNpmAudit(JSON.parse(all.output), JSON.parse(prod.output)) }
  } catch {
    return { status: 'failed', findings: [], message: `npm audit no devolvió JSON:\n${tail(all.output)}` }
  }
}

async function installedProductionPackages(ctx: StageContext): Promise<InstalledPackage[]> {
  const { output } = await runCommand('npm ls --omit=dev --all --json', { cwd: ctx.root, quiet: true })
  type Node = { version?: string; dependencies?: Record<string, Node> }
  const seen = new Map<string, InstalledPackage>()
  const walk = (deps: Record<string, Node> = {}) => {
    for (const [name, node] of Object.entries(deps)) {
      const pkgFile = path.join(ctx.root, 'node_modules', name, 'package.json')
      if (!node.version || seen.has(`${name}@${node.version}`) || !existsSync(pkgFile)) continue
      const pkg = readJson(pkgFile)
      const license = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? pkg.licenses?.[0]?.type ?? '')
      seen.set(`${name}@${node.version}`, { name, version: node.version, license })
      walk(node.dependencies)
    }
  }
  walk((JSON.parse(output) as Node).dependencies)
  return [...seen.values()]
}

async function licenses(ctx: StageContext): Promise<Check> {
  const policy = readJson(path.join(ctx.root, 'compliance', 'licencias.json')) as LicensePolicy
  const packages = await installedProductionPackages(ctx)
  return { status: 'passed', findings: checkLicenses(packages, policy), metrics: { licenses: { packages: packages.length } } }
}

async function sbom(ctx: StageContext): Promise<Check> {
  const out = path.join(ctx.runDir, 'sbom.cdx.json')
  const { code, output } = await runCommand(
    `npx @cyclonedx/cyclonedx-npm --omit dev --output-format JSON --output-file "${out}"`,
    { cwd: ctx.root, quiet: true },
  )
  if (code !== 0 || !existsSync(out)) return { status: 'failed', findings: [], message: `No se pudo generar el SBOM:\n${tail(output)}` }
  const components = (readJson(out).components ?? []).length
  return { status: 'passed', findings: [], metrics: { sbom: { format: 'CycloneDX', components, file: 'sbom.cdx.json' } } }
}

async function dockerAvailable(ctx: StageContext): Promise<boolean> {
  return commandExists('docker') && (await runCommand('docker info', { cwd: ctx.root, quiet: true })).code === 0
}

async function dast(ctx: StageContext, base: string): Promise<Check> {
  if (!(await dockerAvailable(ctx))) {
    return { status: 'skipped', findings: [], message: 'Docker no está disponible para ejecutar OWASP ZAP; se ejecuta en CI' }
  }
  const work = path.join(ctx.runDir, 'zap')
  mkdirSync(work, { recursive: true })
  chmodSync(work, 0o777)
  // --network host: the container reaches the store started on this same machine (own system only, never third parties).
  const target = process.platform === 'linux' ? base : base.replace('localhost', 'host.docker.internal')
  const network = process.platform === 'linux' ? '--network host' : ''
  const { output } = await runCommand(
    `docker run --rm ${network} -v "${work}:/zap/wrk:rw" ${ZAP_IMAGE} zap-baseline.py -t ${target} -J zap.json -I`,
    { cwd: ctx.root, quiet: true },
  )
  const report = path.join(work, 'zap.json')
  if (!existsSync(report)) return { status: 'failed', findings: [], message: `ZAP no produjo informe:\n${tail(output)}` }
  const accepted = readJson(path.join(ctx.root, 'compliance', 'zap-aceptadas.json')).aceptadas
  return { status: 'passed', findings: fromZap(readJson(report), accepted) }
}

const CHECKS: { id: string; title: string; requirement: string; tag: string }[] = [
  { id: 'sast', title: 'Análisis estático de seguridad (Semgrep)', requirement: 'SEC-002', tag: '@security' },
  { id: 'deps', title: 'Dependencias sin vulnerabilidades graves (npm audit)', requirement: 'SEC-003', tag: '@security' },
  { id: 'licenses', title: 'Licencias de producción permitidas', requirement: 'CMP-001', tag: '@compliance' },
  { id: 'sbom', title: 'Inventario de componentes (SBOM CycloneDX)', requirement: 'CMP-002', tag: '@compliance' },
  { id: 'dast', title: 'Análisis dinámico pasivo (OWASP ZAP baseline)', requirement: 'SEC-004', tag: '@security' },
]

/** SAST, dependencies, licences, SBOM and passive DAST against the store started here (QA-027). */
export const securityStage: StageDefinition = {
  id: 'security',
  name: 'Seguridad y cumplimiento',
  blocking: true,
  dependsOn: ['build'],
  async run(ctx) {
    resetE2eDatabase(ctx.root)
    const base = `http://localhost:${E2E_PORT}`
    const server = startBackground(`npx next start -p ${E2E_PORT}`, ctx.root, { DATABASE_URL: E2E_DATABASE_URL })
    const tests: TestResult[] = []
    const findings: Finding[] = []
    const metrics: Record<string, unknown> = {}
    try {
      for (const check of CHECKS) {
        ctx.log(`  · ${check.title}`)
        const started = Date.now()
        let result: Check
        try {
          result =
            check.id === 'sast' ? await sast(ctx)
            : check.id === 'deps' ? await dependencies(ctx)
            : check.id === 'licenses' ? await licenses(ctx)
            : check.id === 'sbom' ? await sbom(ctx)
            : await dast(ctx, base)
        } catch (error) {
          result = { status: 'failed', findings: [], message: (error as Error).message }
        }
        findings.push(...result.findings)
        Object.assign(metrics, result.metrics ?? {})
        const blocking = blockingFindings(result.findings)
        const status = result.status === 'passed' && blocking.length ? 'failed' : result.status
        const message =
          result.message ??
          (blocking.length
            ? `Bloquean: ${blocking.map((f) => `${f.title}${f.location ? ` (${f.location})` : ''}`).join('; ')}`
            : result.findings.length
              ? `${result.findings.length} hallazgo(s) no bloqueante(s)`
              : undefined)
        tests.push({
          id: `security-${check.id}`,
          title: check.title,
          file: '',
          stage: 'security',
          status,
          durationMs: Date.now() - started,
          retries: 0,
          requirements: [check.requirement, 'QA-027'],
          tags: [check.tag],
          ...(message ? { message } : {}),
        })
      }
    } finally {
      killTree(server)
    }
    const failed = tests.filter((t) => t.status === 'failed')
    return {
      status: failed.length ? 'failed' : 'passed',
      reason: failed.length ? failed.map((t) => `${t.title}: ${t.message}`).join(' | ') : undefined,
      tests,
      findings,
      metrics,
    }
  },
}
