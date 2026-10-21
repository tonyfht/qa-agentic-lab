import type { ApiError } from '@/lib/api/schemas'
import { CartError, getCart } from './repository'
import { readCartId, writeCartId } from './session'

/** Runs a cart operation and answers with the resulting cart, or with the error and its status. */
export async function cartResponse(operation: (cartId: string | null) => Promise<string | void>): Promise<Response> {
  try {
    const current = await readCartId()
    const id = (await operation(current)) ?? current
    if (id && id !== current) await writeCartId(id)
    return Response.json(await getCart(id))
  } catch (error) {
    if (error instanceof CartError) {
      return Response.json({ error: error.message } satisfies ApiError, { status: error.status })
    }
    throw error
  }
}

/** Reads a JSON body; invalid JSON is a 400 with a clear message instead of a 500. */
export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    if (body && typeof body === 'object') return body as Record<string, unknown>
  } catch {
    // fall through
  }
  throw new CartError(400, 'El cuerpo de la petición debe ser un objeto JSON')
}
