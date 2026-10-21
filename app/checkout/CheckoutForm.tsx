'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field } from '@/app/_components/Field'
import { postJson } from '@/app/_components/postJson'

export function CheckoutForm({ total }: { total: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setPending(true)
    const result = await postJson('/api/checkout', {
      shipping: { fullName: f.fullName, address: f.address, city: f.city, postalCode: f.postalCode },
      payment: { cardNumber: f.cardNumber, expiry: f.expiry, cvc: f.cvc },
    })
    setPending(false)
    if (result.ok && result.data.number) {
      router.push(`/cuenta/pedidos/${result.data.number}?nuevo=1`)
      router.refresh()
      return
    }
    setError(result.data.error ?? 'No se ha podido completar el pago')
    setFields(result.data.fields ?? {})
  }

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-6" aria-label="Pago">
      <fieldset className="flex flex-col gap-4 rounded-2xl border border-store-ink/10 bg-white p-5">
        <legend className="px-1 font-serif text-xl font-semibold">Envío</legend>
        <Field label="Nombre completo" name="fullName" autoComplete="name" error={fields.fullName} />
        <Field label="Dirección" name="address" autoComplete="street-address" error={fields.address} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ciudad" name="city" autoComplete="address-level2" error={fields.city} />
          <Field label="Código postal" name="postalCode" inputMode="numeric" autoComplete="postal-code" error={fields.postalCode} />
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-4 rounded-2xl border border-store-ink/10 bg-white p-5">
        <legend className="px-1 font-serif text-xl font-semibold">Pago (simulado)</legend>
        <p className="text-sm text-store-muted">
          No se cobra nada. Usa la tarjeta de prueba <code>4242 4242 4242 4242</code>; las demás tarjetas de prueba están
          en el README.
        </p>
        <Field label="Número de tarjeta" name="cardNumber" inputMode="numeric" autoComplete="off" error={fields.cardNumber} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Caducidad (MM/AA)" name="expiry" placeholder="12/30" autoComplete="off" error={fields.expiry} />
          <Field label="CVC" name="cvc" inputMode="numeric" autoComplete="off" error={fields.cvc} />
        </div>
      </fieldset>
      {error && (
        <p role="alert" data-testid="checkout-error" className="rounded-xl bg-store-terracotta/10 p-3 text-store-terracotta-dark">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-store-terracotta px-5 py-4 text-lg font-semibold text-white hover:bg-store-terracotta-dark disabled:opacity-60"
      >
        Pagar {total}
      </button>
    </form>
  )
}
