import { handle, requireAccount } from '@/lib/account/http'
import type { ApiError } from '@/lib/api/schemas'
import { getOrder } from '@/lib/orders/repository'

export const dynamic = 'force-dynamic'

export function GET(_request: Request, { params }: { params: Promise<{ number: string }> }) {
  return handle(async () => {
    const account = await requireAccount()
    const { number } = await params
    const order = await getOrder(account.id, number)
    // Same answer for "not yours" and "does not exist" (ORD-003).
    if (!order) return Response.json({ error: `El pedido ${number} no existe` } satisfies ApiError, { status: 404 })
    return Response.json(order)
  })
}
