import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const HealthResponse = z
  .object({
    status: z.literal('ok').openapi({ description: 'La aplicación está operativa' }),
    version: z.string().openapi({ example: '0.1.0', description: 'Versión desplegada de la tienda' }),
  })
  .openapi('HealthResponse')

export type HealthResponse = z.infer<typeof HealthResponse>
