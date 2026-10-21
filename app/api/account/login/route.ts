import { handle, readJson } from '@/lib/account/http'
import { authenticate } from '@/lib/account/repository'
import { startSession } from '@/lib/account/session'

export function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request)
    const account = await authenticate(body.email, body.password)
    await startSession(account.id)
    return Response.json({ name: account.name, email: account.email })
  })
}
