import { randomBytes } from 'node:crypto'
import { getDb } from '@/lib/db/client'
import { DUMMY_HASH, hashPassword, verifyPassword } from './password'
import { normalizeEmail, type RegisterInput } from './validation'

export const SESSION_DAYS = 7

export interface Account {
  id: number
  name: string
  email: string
}

export class AccountError extends Error {
  constructor(
    readonly status: 400 | 401 | 409,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message)
  }
}

export async function createAccount(input: RegisterInput): Promise<Account> {
  const db = await getDb()
  const { rows } = await db.execute({ sql: 'SELECT 1 FROM users WHERE email = ?', args: [input.email] })
  if (rows.length) {
    throw new AccountError(409, 'Ya existe una cuenta con ese correo', { email: 'Ya existe una cuenta con ese correo' })
  }
  const result = await db.execute({
    sql: 'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    args: [input.name, input.email, hashPassword(input.password), new Date().toISOString()],
  })
  return { id: Number(result.lastInsertRowid), name: input.name, email: input.email }
}

/** Same message (and similar time) whether the e-mail exists or not (ACC-002). */
export async function authenticate(email: unknown, password: unknown): Promise<Account> {
  const fail = new AccountError(401, 'Correo o contraseña incorrectos')
  if (typeof email !== 'string' || typeof password !== 'string') throw fail
  const db = await getDb()
  const { rows } = await db.execute({
    sql: 'SELECT id, name, email, password_hash FROM users WHERE email = ?',
    args: [normalizeEmail(email)],
  })
  const row = rows[0]
  const ok = verifyPassword(password, row ? String(row.password_hash) : DUMMY_HASH)
  if (!row || !ok) throw fail
  return { id: Number(row.id), name: String(row.name), email: String(row.email) }
}

/** Opaque random id; the cookie carries nothing about the customer (ACC-003). */
export async function createSession(userId: number): Promise<{ id: string; expires: Date }> {
  const id = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)
  const db = await getDb()
  await db.execute({
    sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    args: [id, userId, expires.toISOString()],
  })
  return { id, expires }
}

/** An expired or unknown session is the same as no session. */
export async function accountForSession(sessionId: string | null, now = new Date()): Promise<Account | null> {
  if (!sessionId) return null
  const db = await getDb()
  const { rows } = await db.execute({
    sql: `SELECT u.id, u.name, u.email, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
    args: [sessionId],
  })
  const row = rows[0]
  if (!row || Date.parse(String(row.expires_at)) <= now.getTime()) return null
  return { id: Number(row.id), name: String(row.name), email: String(row.email) }
}

export async function deleteSession(sessionId: string | null): Promise<void> {
  if (!sessionId) return
  const db = await getDb()
  await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [sessionId] })
}
