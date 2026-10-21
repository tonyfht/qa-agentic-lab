import { redirect } from 'next/navigation'
import { currentAccount } from './session'

/** Pages that need a session send visitors to log in and bring them back afterwards (ACC-004). */
export async function requirePageAccount(returnTo: string) {
  const account = await currentAccount()
  if (!account) redirect(`/cuenta/entrar?next=${encodeURIComponent(returnTo)}`)
  return account
}
