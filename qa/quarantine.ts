import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { TestResult } from './results/schema'

export const QUARANTINE_FILE = path.join('qa', 'cuarentena.json')
export const MAX_QUARANTINE_DAYS = 14

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const QuarantineEntry = z.object({
  titulo: z.string().min(1),
  fichero: z.string().min(1),
  motivo: z.string().min(10),
  issue: z.url(),
  desde: z.string().regex(ISO_DATE),
  hasta: z.string().regex(ISO_DATE),
})
export type QuarantineEntry = z.infer<typeof QuarantineEntry>

const days = (from: string, to: string) => (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000

/** Errors in the quarantine list (QA-028): incomplete, expired or longer than the maximum. Empty when it is valid. */
export function checkQuarantine(json: unknown, today: string): string[] {
  const parsed = z.object({ tests: z.array(z.unknown()) }).safeParse(json)
  if (!parsed.success) return [`${QUARANTINE_FILE}: debe tener una lista "tests"`]
  return parsed.data.tests.flatMap((raw, i) => {
    const entry = QuarantineEntry.safeParse(raw)
    const name = (raw as { titulo?: string })?.titulo ?? `entrada ${i + 1}`
    if (!entry.success) return entry.error.issues.map((e) => `${name}: falta o no es válido "${e.path.join('.')}"`)
    const { desde, hasta } = entry.data
    const errors: string[] = []
    if (days(desde, hasta) > MAX_QUARANTINE_DAYS)
      errors.push(`${name}: la cuarentena dura ${days(desde, hasta)} días; el máximo es ${MAX_QUARANTINE_DAYS}`)
    if (hasta < today) errors.push(`${name}: la cuarentena caducó el ${hasta}. Corrige el test o renueva la entrada con un motivo nuevo`)
    return errors
  })
}

export function readQuarantine(root: string): QuarantineEntry[] {
  const file = path.join(root, QUARANTINE_FILE)
  if (!existsSync(file)) return []
  const parsed = z.object({ tests: z.array(QuarantineEntry) }).safeParse(JSON.parse(readFileSync(file, 'utf8')))
  return parsed.success ? parsed.data.tests : []
}

export function isQuarantined(test: Pick<TestResult, 'title' | 'file'>, entries: QuarantineEntry[]): boolean {
  return entries.some((e) => e.titulo === test.title && e.fichero === test.file)
}

/**
 * Failed tests in quarantine do not block (QA-028): their message says so, and the stage passes when no other
 * test failed. Returns the tests annotated and whether something outside quarantine failed.
 */
export function applyQuarantine(tests: TestResult[], entries: QuarantineEntry[]): { tests: TestResult[]; blocking: TestResult[] } {
  const annotated = tests.map((t) =>
    t.status === 'failed' && isQuarantined(t, entries) ? { ...t, message: `En cuarentena: ${t.message ?? ''}`.trim() } : t,
  )
  return { tests: annotated, blocking: annotated.filter((t) => t.status === 'failed' && !isQuarantined(t, entries)) }
}
