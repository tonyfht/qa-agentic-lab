import { rmSync } from 'node:fs'
import path from 'node:path'

// The store used by the E2E tests: its own port and its own database, reset before each run.
export const E2E_PORT = 3410
export const E2E_DATABASE_FILE = path.join('.data', 'e2e.db')
export const E2E_DATABASE_URL = `file:${E2E_DATABASE_FILE}`

export function resetE2eDatabase(root: string) {
  for (const suffix of ['', '-journal', '-wal', '-shm']) rmSync(path.join(root, E2E_DATABASE_FILE + suffix), { force: true })
}
