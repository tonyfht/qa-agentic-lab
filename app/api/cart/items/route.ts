import { cartResponse, jsonBody } from '@/lib/cart/http'
import { addItem } from '@/lib/cart/repository'

export function POST(request: Request) {
  return cartResponse(async (cartId) => {
    const body = await jsonBody(request)
    return addItem(cartId, String(body.slug ?? ''), body.quantity)
  })
}
