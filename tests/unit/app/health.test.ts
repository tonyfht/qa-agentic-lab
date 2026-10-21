import { describe, expect, it } from 'vitest'
import { GET } from '@/app/api/health/route'
import pkg from '@/package.json'

describe('QA-001 La tienda arranca y responde', () => {
  it('GET /api/health responde 200 con estado ok y la versión de package.json', async () => {
    const res = GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok', version: pkg.version })
  })
})
