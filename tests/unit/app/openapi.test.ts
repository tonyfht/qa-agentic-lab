import { describe, expect, it } from 'vitest'
import { buildOpenApiDocument } from '@/lib/api/openapi'

describe('QA-001 Contrato OpenAPI de la tienda', () => {
  const doc = buildOpenApiDocument()

  it('es un documento OpenAPI 3.1 con título y versión', () => {
    expect(doc.openapi).toBe('3.1.0')
    expect(doc.info.title).toContain('La Tienda en Casa')
    expect(doc.info.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('incluye la operación de salud con su esquema de respuesta', () => {
    const op = doc.paths?.['/api/health']?.get
    expect(op?.operationId).toBe('getHealth')
    expect(doc.components?.schemas).toHaveProperty('HealthResponse')
  })
})
