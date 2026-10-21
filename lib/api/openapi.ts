import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { appVersion } from '@/lib/version'
import { HealthResponse } from './schemas'

// The API contract is generated from the same Zod schemas the handlers use, so it cannot drift from the code.
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry()

  registry.registerPath({
    method: 'get',
    path: '/api/health',
    operationId: 'getHealth',
    summary: 'Estado de salud de la tienda',
    tags: ['Sistema'],
    responses: {
      200: {
        description: 'La tienda está operativa',
        content: { 'application/json': { schema: HealthResponse } },
      },
    },
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
