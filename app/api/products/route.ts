import { searchCatalog } from '@/lib/catalog/service'
import type { ApiError } from '@/lib/api/schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const { page, errors } = await searchCatalog(params)
  if (errors.length > 0) {
    return Response.json({ error: 'Parámetros no válidos', details: errors } satisfies ApiError, { status: 400 })
  }
  return Response.json(page)
}
