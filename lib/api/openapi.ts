import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { appVersion } from '@/lib/version'
import { ApiError, CatalogQueryParams, Category, HealthResponse, Product, ProductList } from './schemas'

const json = (schema: z.ZodType, description: string) => ({ description, content: { 'application/json': { schema } } })

// The API contract is generated from the same Zod schemas the handlers use, so it cannot drift from the code.
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry()

  registry.registerPath({
    method: 'get',
    path: '/api/health',
    operationId: 'getHealth',
    summary: 'Estado de salud de la tienda',
    tags: ['Sistema'],
    responses: { 200: json(HealthResponse, 'La tienda está operativa') },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/products',
    operationId: 'listProducts',
    summary: 'Buscar, filtrar, ordenar y paginar el catálogo',
    tags: ['Catálogo'],
    request: { query: CatalogQueryParams },
    responses: {
      200: json(ProductList, 'Una página del catálogo'),
      400: json(ApiError, 'Parámetros no válidos, con el motivo de cada uno'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/products/{slug}',
    operationId: 'getProduct',
    summary: 'Ficha de un artículo',
    tags: ['Catálogo'],
    request: { params: z.object({ slug: z.string().openapi({ example: 'manta-punto-gruesa' }) }) },
    responses: {
      200: json(Product, 'El artículo'),
      404: json(ApiError, 'El artículo no existe'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/categories',
    operationId: 'listCategories',
    summary: 'Categorías con su número de artículos',
    tags: ['Catálogo'],
    responses: { 200: json(z.array(Category), 'Las categorías en el orden de la tienda') },
  })

  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'La Tienda en Casa — API',
      version: appVersion,
      description: 'API de la tienda de demostración de QA Agentic Lab.',
    },
  })
}
