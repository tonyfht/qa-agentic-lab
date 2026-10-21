import { endSession } from '@/lib/account/session'

export async function POST() {
  await endSession()
  return Response.json({ status: 'ok' })
}
