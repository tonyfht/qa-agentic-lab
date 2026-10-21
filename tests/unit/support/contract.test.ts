import { describe, expect, it } from 'vitest'
import { buildOpenApiDocument } from '@/lib/api/openapi'
import { ContractChecker } from '@/tests/support/contract'
import { sweepableOperations } from '@/tests/support/contract-sweep'

const checker = new ContractChecker(buildOpenApiDocument() as never)
const product = {
  slug: 'manta-punto-gruesa',
  name: 'Manta de punto gruesa',
  description: 'x',
  category: 'textil',
  categoryName: 'Textil',
  priceCents: 1990,
  stock: 15,
  rating: 4.8,
  isNew: true,
}

describe('CAT-008 API del catálogo con contrato publicado', () => {
  it('acepta una respuesta que cumple el esquema', () => {
    expect(checker.validate('getProduct', 200, product)).toEqual([])
    expect(checker.validate('listProducts', 200, { items: [product], total: 1, page: 1, pageCount: 1, pageSize: 12 })).toEqual([])
  })

  it('detecta una respuesta que no cumple el esquema e indica el campo', () => {
    const errors = checker.validate('getProduct', 200, { ...product, priceCents: '19,90' })
    expect(errors.join()).toMatch(/\/priceCents must be integer/)
  })

  it('valida también los errores publicados y señala los que el contrato no declara', () => {
    expect(checker.validate('listProducts', 400, { error: 'x', details: ['y'] })).toEqual([])
    expect(checker.validate('listProducts', 500, {})).toEqual(['El contrato no declara la respuesta 500 de listProducts'])
    expect(checker.validate('noExiste', 200, {})[0]).toMatch(/no está en el contrato/)
  })
})

describe('QA-047 Agente de API y barrido de contrato', () => {
  it('elige las lecturas públicas sin parámetros obligatorios del contrato de la tienda', () => {
    const ops = sweepableOperations(buildOpenApiDocument() as never).map((o) => o.operationId)
    expect(ops).toEqual(['getHealth', 'listProducts', 'listCategories', 'getCart'])
  })

  it('excluye operaciones con parámetros de ruta, parámetros obligatorios o que exigen sesión', () => {
    const doc = {
      paths: {
        '/a': { get: { operationId: 'a', responses: { 200: {} } } },
        '/b/{id}': { get: { operationId: 'b', responses: { 200: {} } } },
        '/c': { get: { operationId: 'c', parameters: [{ in: 'query', required: true }], responses: { 200: {} } } },
        '/d': { get: { operationId: 'd', responses: { 200: {}, 401: {} } } },
        '/e': { post: { operationId: 'e', responses: { 200: {} } } },
      },
    }
    expect(sweepableOperations(doc).map((o) => o.operationId)).toEqual(['a'])
  })

  it('una respuesta que no cumple su esquema se señala con la operación y el campo', () => {
    expect(checker.validate('listCategories', 200, [{ slug: 'x', name: 'X', count: 'tres' }]).join()).toMatch(/\/0\/count must be integer/)
  })
})
