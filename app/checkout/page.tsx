import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePageAccount } from '@/lib/account/guard'
import { getCart } from '@/lib/cart/repository'
import { readCartId } from '@/lib/cart/session'
import { formatPrice } from '@/lib/catalog/query'
import { CheckoutForm } from './CheckoutForm'

export const metadata: Metadata = { title: 'Pagar' }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  await requirePageAccount('/checkout')
  const cart = await getCart(await readCartId())
  if (cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Tu carrito está vacío</h1>
        <Link href="/catalogo" className="mt-4 inline-block underline">
          Ir al catálogo
        </Link>
      </main>
    )
  }
  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1fr_300px]">
      <section>
        <h1 className="mb-4 text-3xl font-bold">Pagar</h1>
        <CheckoutForm total={formatPrice(cart.totals.totalCents)} />
      </section>
      <aside className="self-start rounded-2xl bg-white p-4" aria-labelledby="checkout-summary">
        <h2 id="checkout-summary" className="mb-2 text-lg font-bold">
          Tu pedido
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          {cart.items.map((i) => (
            <li key={i.slug} className="flex justify-between gap-2">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatPrice(i.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-store-ink/10 pt-2 font-bold">
          <span>Total</span>
          <span>{formatPrice(cart.totals.totalCents)}</span>
        </p>
      </aside>
    </main>
  )
}
