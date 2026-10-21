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

describe('CAT-008 API del catálogo con contrato publicado', () => {
  const doc = buildOpenApiDocument()

  it('documenta las operaciones del catálogo con sus respuestas de error', () => {
    expect(doc.paths?.['/api/products']?.get?.operationId).toBe('listProducts')
    expect(Object.keys(doc.paths?.['/api/products']?.get?.responses ?? {})).toEqual(['200', '400'])
    expect(Object.keys(doc.paths?.['/api/products/{slug}']?.get?.responses ?? {})).toEqual(['200', '404'])
    expect(doc.paths?.['/api/categories']?.get?.operationId).toBe('listCategories')
    for (const s of ['Product', 'ProductList', 'Category', 'ApiError']) expect(doc.components?.schemas).toHaveProperty(s)
  })
})
