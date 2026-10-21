import { cookies } from 'next/headers'
import { cache } from 'react'
import { accountForSession, createSession, deleteSession, type Account } from './repository'

export const SESSION_COOKIE = 'session'

/** The signed-in customer of this request, or null. Cached so the header and the page share one query. */
export const currentAccount = cache(async (): Promise<Account | null> => {
  return accountForSession((await cookies()).get(SESSION_COOKIE)?.value ?? null)
})

export async function startSession(userId: number): Promise<void> {
  const { id, expires } = await createSession(userId)
  ;(await cookies()).set(SESSION_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', expires })
}

export async function endSession(): Promise<void> {
  const jar = await cookies()
  await deleteSession(jar.get(SESSION_COOKIE)?.value ?? null)
  jar.delete(SESSION_COOKIE)
}
