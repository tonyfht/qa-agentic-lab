import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckoutSteps } from '@/app/_components/CheckoutSteps'
import { LockIcon } from '@/app/_components/icons'
import { ProductImage } from '@/app/_components/ProductImage'
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
        <h1 className="text-4xl font-semibold">Tu carrito está vacío</h1>
        <Link href="/catalogo" className="mt-6 inline-block rounded-full bg-store-terracotta px-6 py-3 font-semibold text-white hover:bg-store-terracotta-dark">
          Ir al catálogo
        </Link>
      </main>
    )
  }
  const t = cart.totals
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <CheckoutSteps current="Envío y pago" />
      <div className="grid gap-8 md:grid-cols-[1fr_360px]">
        <section>
          <h1 className="mb-5 text-4xl font-semibold">Pagar</h1>
          <CheckoutForm total={formatPrice(t.totalCents)} />
        </section>
        <aside className="flex flex-col gap-4 self-start rounded-2xl border border-store-ink/10 bg-white p-5 md:sticky md:top-4" aria-labelledby="checkout-summary">
          <h2 id="checkout-summary" className="text-2xl font-semibold">
            Tu pedido
          </h2>
          <ul className="flex flex-col gap-3 text-sm">
            {cart.items.map((i) => (
              <li key={i.slug} className="flex items-center gap-3">
                <span className="w-12 shrink-0 overflow-hidden rounded-lg bg-store-sand">
                  <ProductImage slug={i.slug} name={i.name} category={i.category} sizes="48px" />
                </span>
                <span className="flex-1">
                  {i.quantity} × {i.name}
                </span>
                <span>{formatPrice(i.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-1.5 border-t border-store-ink/10 pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrice(t.subtotalCents)}</dd>
            </div>
            {t.discountCents > 0 && (
              <div className="flex justify-between">
                <dt>Descuento</dt>
                <dd>{formatPrice(-t.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd>{t.shippingCents === 0 ? 'Gratis' : formatPrice(t.shippingCents)}</dd>
            </div>
            <div className="mt-1 flex justify-between text-lg font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(t.totalCents)}</dd>
            </div>
          </dl>
          <p className="flex items-center gap-2 rounded-xl bg-store-sand p-3 text-xs text-store-muted">
            <LockIcon className="size-4 shrink-0" /> Pago simulado: no se cobra nada y la tarjeta no se guarda.
          </p>
        </aside>
      </div>
    </main>
  )
}
