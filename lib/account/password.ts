import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 32

/** Salted scrypt hash stored as `scrypt$<salt hex>$<hash hex>` (ACC-003). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, KEY_LENGTH).toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(expected, actual)
}

// Hashed once at load: login with an unknown e-mail still runs a full verification, so timing does not tell
// whether an account exists (ACC-002).
export const DUMMY_HASH = hashPassword('cuenta-inexistente-0')
