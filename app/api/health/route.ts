import { getHealth } from '@/lib/api/health'

export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(getHealth())
}
