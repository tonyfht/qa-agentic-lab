import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { currentAccount } from '@/lib/account/session'
import { safeNext } from '@/lib/account/validation'
import { LoginForm } from '../AccountForms'

export const metadata: Metadata = { title: 'Entrar' }
export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next)
  if (await currentAccount()) redirect(next)
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Entrar</h1>
      <LoginForm next={next} />
      <p className="mt-6 rounded-lg bg-white p-3 text-sm text-store-muted">
        Cuenta de demostración: <code>cliente@ejemplo.test</code> / <code>Casa2026</code>
      </p>
    </main>
  )
}
