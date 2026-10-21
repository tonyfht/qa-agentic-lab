import { handle, readJson } from '@/lib/account/http'
import { AccountError, createAccount } from '@/lib/account/repository'
import { startSession } from '@/lib/account/session'
import { validateRegistration } from '@/lib/account/validation'

export function POST(request: Request) {
  return handle(async () => {
    const { value, fields } = validateRegistration(await readJson(request))
    if (!value) throw new AccountError(400, 'Revisa los datos del registro', fields)
    const account = await createAccount(value)
    await startSession(account.id)
    return Response.json({ name: account.name, email: account.email }, { status: 201 })
  })
}
