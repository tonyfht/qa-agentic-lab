import { cartResponse, jsonBody } from '@/lib/cart/http'
import { removeItem, setQuantity } from '@/lib/cart/repository'

type Ctx = { params: Promise<{ slug: string }> }

export function PATCH(request: Request, { params }: Ctx) {
  return cartResponse(async (cartId) => {
    const { slug } = await params
    const body = await jsonBody(request)
    await setQuantity(cartId, slug, body.quantity)
  })
}

export function DELETE(_request: Request, { params }: Ctx) {
  return cartResponse(async (cartId) => removeItem(cartId, (await params).slug))
}
