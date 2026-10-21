import { handle, requireAccount } from '@/lib/account/http'
import { listOrders } from '@/lib/orders/repository'

export const dynamic = 'force-dynamic'

export function GET() {
  return handle(async () => Response.json(await listOrders((await requireAccount()).id)))
}
