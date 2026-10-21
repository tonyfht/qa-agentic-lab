import { getProduct } from '@/lib/catalog/repository'
import type { ApiError } from '@/lib/api/schemas'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return Response.json({ error: `El artículo «${slug}» no existe` } satisfies ApiError, { status: 404 })
  return Response.json(product)
}
