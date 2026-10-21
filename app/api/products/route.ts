import { searchCatalog } from '@/lib/catalog/service'
import type { ApiError } from '@/lib/api/schemas'
import { activeDefect } from '@/lib/qa/defects'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Injected defect `caida` (QA-029): the product API behaves as if its database were down.
  if (activeDefect() === 'caida') {
    return Response.json({ error: 'Servicio no disponible' } satisfies ApiError, { status: 503 })
  }
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const { page, errors } = await searchCatalog(params)
  if (errors.length > 0) {
    return Response.json({ error: 'Parámetros no válidos', details: errors } satisfies ApiError, { status: 400 })
  }
  return Response.json(page)
}
