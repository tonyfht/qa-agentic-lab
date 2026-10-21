import { handle, requireAccount } from '@/lib/account/http'

export const dynamic = 'force-dynamic'

export function GET() {
  return handle(async () => {
    const account = await requireAccount()
    return Response.json({ name: account.name, email: account.email })
  })
}
