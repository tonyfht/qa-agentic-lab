import { handle, readJson, requireAccount } from '@/lib/account/http'
import { readCartId } from '@/lib/cart/session'
import { placeOrder } from '@/lib/orders/place'

export function POST(request: Request) {
  return handle(async () => {
    const account = await requireAccount()
    const body = await readJson(request)
    const order = await placeOrder(account.id, await readCartId(), body)
    return Response.json(order, { status: 201 })
  })
}
