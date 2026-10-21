import { cookies } from 'next/headers'

export const CART_COOKIE = 'cart_id'

/** The cart belongs to the browser that created it (CART-004): an HttpOnly session cookie with a random id. */
export async function readCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null
}

export async function writeCartId(id: string): Promise<void> {
  ;(await cookies()).set(CART_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/' })
}
