import { cartResponse, jsonBody } from '@/lib/cart/http'
import { applyCoupon, removeCoupon } from '@/lib/cart/repository'

export function POST(request: Request) {
  return cartResponse(async (cartId) => applyCoupon(cartId, (await jsonBody(request)).code))
}

export function DELETE() {
  return cartResponse(async (cartId) => removeCoupon(cartId))
}
