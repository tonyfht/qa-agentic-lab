import { listCategories } from '@/lib/catalog/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(await listCategories())
}
