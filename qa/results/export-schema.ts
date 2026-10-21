import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { runResultJsonSchema, SCHEMA_VERSION } from './schema'

export const SCHEMA_FILE = path.join('schemas', `run-result.v${SCHEMA_VERSION}.json`)

export function serializedJsonSchema(): string {
  return JSON.stringify({ $id: `run-result.v${SCHEMA_VERSION}.json`, ...runResultJsonSchema() }, null, 2) + '\n'
}

if (process.argv[1]?.endsWith('export-schema.ts')) {
  writeFileSync(SCHEMA_FILE, serializedJsonSchema())
  console.log(`Esquema escrito en ${SCHEMA_FILE}`)
}
