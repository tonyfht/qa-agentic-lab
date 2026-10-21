import { cartResponse } from '@/lib/cart/http'

export const dynamic = 'force-dynamic'

export function GET() {
  return cartResponse(async () => {})
}
