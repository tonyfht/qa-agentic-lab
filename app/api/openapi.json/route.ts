import { buildOpenApiDocument } from '@/lib/api/openapi'

export function GET() {
  return Response.json(buildOpenApiDocument())
}
