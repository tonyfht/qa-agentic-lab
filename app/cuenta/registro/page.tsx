import type { Metadata } from 'next'
import { safeNext } from '@/lib/account/validation'
import { RegisterForm } from '../AccountForms'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next)
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-4xl font-semibold">Crear cuenta</h1>
      <RegisterForm next={next} />
      <p className="mt-4 text-sm text-store-muted">Es una tienda de demostración: usa datos ficticios.</p>
    </main>
  )
}
