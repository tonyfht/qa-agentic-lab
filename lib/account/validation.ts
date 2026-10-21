export interface RegisterInput {
  name: string
  email: string
  password: string
}

export type FieldErrors = Record<string, string>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** ACC-001: name, a valid e-mail and a password of 8+ characters with at least one letter and one number. */
export function validateRegistration(input: Record<string, unknown>): { value?: RegisterInput; fields: FieldErrors } {
  const fields: FieldErrors = {}
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const email = typeof input.email === 'string' ? normalizeEmail(input.email) : ''
  const password = typeof input.password === 'string' ? input.password : ''
  if (!name) fields.name = 'El nombre es obligatorio'
  if (!EMAIL.test(email)) fields.email = 'Escribe un correo válido'
  if (password.length < 8 || !/\p{L}/u.test(password) || !/\d/.test(password)) {
    fields.password = 'La contraseña necesita al menos 8 caracteres, una letra y un número'
  }
  return Object.keys(fields).length ? { fields } : { value: { name, email, password }, fields }
}

/**
 * Where to go after logging in (ACC-004). Only internal paths are allowed — "/x" but not "//x" or "https://…" —
 * so the login page cannot be used as an open redirect.
 */
export function safeNext(next: string | null | undefined, fallback = '/cuenta/pedidos'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
