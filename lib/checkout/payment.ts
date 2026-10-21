// Simulated payment (CHK-002). Deterministic test cards; nothing about the card is stored except brand and last 4
// digits, and no message ever repeats the card number (CHK-005).

export const DECLINED = '4000000000000002'
export const INSUFFICIENT_FUNDS = '4000000000009995'

export interface PaymentInput {
  cardNumber: string
  expiry: string
  cvc: string
}

export type PaymentResult =
  | { ok: true; brand: 'test'; last4: string }
  | { ok: false; status: 400 | 402; message: string; field?: 'cardNumber' | 'expiry' | 'cvc' }

export function luhnValid(digits: string): boolean {
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return digits.length > 0 && sum % 10 === 0
}

/** "MM/AA" not earlier than the current month. */
export function expiryProblem(expiry: string, now: Date): 400 | 402 | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry.trim())
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return 400
  const year = 2000 + Number(m[2])
  const month = Number(m[1])
  const current = now.getUTCFullYear() * 12 + now.getUTCMonth() + 1
  return year * 12 + month < current ? 402 : null
}

export function charge(input: PaymentInput, now: Date): PaymentResult {
  const digits = String(input.cardNumber ?? '').replace(/\s/g, '')
  if (!/^\d{16}$/.test(digits) || !luhnValid(digits)) {
    return { ok: false, status: 400, message: 'El número de tarjeta no es válido', field: 'cardNumber' }
  }
  const expiry = expiryProblem(String(input.expiry ?? ''), now)
  if (expiry === 400) return { ok: false, status: 400, message: 'La caducidad debe tener el formato MM/AA', field: 'expiry' }
  if (expiry === 402) return { ok: false, status: 402, message: 'La tarjeta ha caducado', field: 'expiry' }
  if (!/^\d{3}$/.test(String(input.cvc ?? ''))) return { ok: false, status: 400, message: 'El CVC debe tener 3 dígitos', field: 'cvc' }
  if (digits === DECLINED) return { ok: false, status: 402, message: 'Tarjeta rechazada por el banco' }
  if (digits === INSUFFICIENT_FUNDS) return { ok: false, status: 402, message: 'Fondos insuficientes' }
  return { ok: true, brand: 'test', last4: digits.slice(-4) }
}
