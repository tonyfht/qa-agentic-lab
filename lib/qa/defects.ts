// Defect injection for the demo (QA-029): one known defect per triage category, switched on only by an explicit
// variable and never in the deployment. Each injection point reads activeDefect() at request time.

export const DEFECTS = {
  cupon: { category: 'producto', description: 'Los cupones distinguen mayúsculas: «bienvenida10» deja de valer' },
  selector: { category: 'test', description: 'El total del catálogo cambia de identificador sin cambiar lo que se ve' },
  caida: { category: 'entorno', description: 'La API de artículos no está disponible (503)' },
} as const

export type Defect = keyof typeof DEFECTS

export const DEFECT_IDS = Object.keys(DEFECTS) as Defect[]

export function isDefect(value: string): value is Defect {
  return Object.hasOwn(DEFECTS, value)
}

/** The injected defect, or null without the variable, in the deployment (VERCEL) or with an unknown value. */
export function activeDefect(env: Record<string, string | undefined> = process.env): Defect | null {
  const value = env.QA_INJECT_DEFECT?.trim()
  if (!value || env.VERCEL) return null
  return isDefect(value) ? value : null
}
