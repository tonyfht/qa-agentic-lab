import { DEFECT_IDS, DEFECTS, isDefect, type Defect } from '../../lib/qa/defects'

export class UnknownDefectError extends Error {
  constructor(value: string) {
    super(`Defecto desconocido «${value}». Disponibles: ${DEFECT_IDS.map((d) => `${d} (${DEFECTS[d].description})`).join('; ')}`)
  }
}

/** `--inject <defecto>` wins over QA_INJECT_DEFECT; empty or "ninguno" means no defect (QA-029). */
export function resolveInjection(option: string | undefined, env: Record<string, string | undefined>): Defect | null {
  const value = (option ?? env.QA_INJECT_DEFECT ?? '').trim()
  if (!value || value === 'ninguno') return null
  if (!isDefect(value)) throw new UnknownDefectError(value)
  return value
}
