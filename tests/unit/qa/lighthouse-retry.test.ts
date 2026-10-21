import { describe, expect, it } from 'vitest'
import { retryToolError, type Attempt } from '@/qa/lib/retry'

const sequence = <T>(...attempts: Attempt<T>[]) => {
  let calls = 0
  return { attempt: async () => attempts[calls++], calls: () => calls }
}

describe('QA-035 Reintento ante errores de la herramienta', () => {
  it('un NO_NAVSTART en la primera medición se reintenta; si el reintento mide, se conserva el error original', async () => {
    const s = sequence<number>({ ok: false, error: 'Lighthouse falló: (NO_NAVSTART)' }, { ok: true, value: 97 })
    expect(await retryToolError(s.attempt)).toEqual({ value: 97, firstError: 'Lighthouse falló: (NO_NAVSTART)', error: null })
    expect(s.calls()).toBe(2)
  })

  it('una medición correcta no se repite, aunque incumpla el presupuesto: eso es un resultado, no un error', async () => {
    const s = sequence<number>({ ok: true, value: 41 })
    expect(await retryToolError(s.attempt)).toEqual({ value: 41, firstError: null, error: null })
    expect(s.calls()).toBe(1)
  })

  it('si la herramienta falla dos veces, el resultado es el error del segundo intento', async () => {
    const s = sequence<number>({ ok: false, error: 'uno' }, { ok: false, error: 'dos' })
    expect(await retryToolError(s.attempt)).toEqual({ value: null, firstError: 'uno', error: 'dos' })
    expect(s.calls()).toBe(2)
  })
})
