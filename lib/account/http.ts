import type { ApiError } from '@/lib/api/schemas'
import { CheckoutError } from '@/lib/orders/place'
import { AccountError } from './repository'
import { currentAccount } from './session'

/** Maps domain errors to their HTTP status with the ApiError body; anything else is a real 500. */
export async function handle(operation: () => Promise<Response>): Promise<Response> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof AccountError || error instanceof CheckoutError) {
      return Response.json(
        { error: error.message, ...(error.fields ? { fields: error.fields } : {}) } satisfies ApiError,
        { status: error.status },
      )
    }
    throw error
  }
}

export async function requireAccount() {
  const account = await currentAccount()
  if (!account) throw new AccountError(401, 'Inicia sesión para continuar')
  return account
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    if (body && typeof body === 'object') return body as Record<string, unknown>
  } catch {
    // fall through
  }
  throw new AccountError(400, 'El cuerpo de la petición debe ser un objeto JSON')
}
