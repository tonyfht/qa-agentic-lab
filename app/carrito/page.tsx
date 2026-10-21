import type { Metadata } from 'next'
import Link from 'next/link'
import { getCart } from '@/lib/cart/repository'
import { readCartId } from '@/lib/cart/session'
import { FREE_SHIPPING_FROM_CENTS } from '@/lib/cart/pricing'
import { formatPrice } from '@/lib/catalog/query'
import { CouponForm, LineControls } from './CartControls'

export const metadata: Metadata = { title: 'Carrito' }
export const dynamic = 'force-dynamic'

function Row({ label, cents, testId, strong }: { label: string; cents: number; testId: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-lg font-bold' : ''}`}>
      <dt>{label}</dt>
      <dd data-testid={testId}>{formatPrice(cents)}</dd>
    </div>
  )
}

export default async function CartPage() {
  const cart = await getCart(await readCartId())
  const t = cart.totals

  if (cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Tu carrito está vacío</h1>
        <p className="mt-2 text-store-muted">Añade artículos desde su ficha.</p>
        <Link href="/catalogo" className="mt-6 inline-block rounded-lg bg-store-terracotta px-4 py-2 font-semibold text-white">
          Ir al catálogo
        </Link>
      </main>
    )
  }

  const missing = FREE_SHIPPING_FROM_CENTS - (t.subtotalCents - t.discountCents)
  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1fr_320px]">
      <section aria-labelledby="cart-title">
        <h1 id="cart-title" className="mb-4 text-3xl font-bold">
          Carrito
        </h1>
        <ul className="flex flex-col gap-3" aria-label="Artículos del carrito">
          {cart.items.map((item) => (
            <li key={item.slug} data-testid="cart-line" data-slug={item.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
              <div>
                <Link href={`/producto/${item.slug}`} className="font-semibold hover:underline">
                  {item.name}
                </Link>
                <p className="text-sm text-store-muted">{formatPrice(item.priceCents)} / unidad</p>
              </div>
              <LineControls slug={item.slug} name={item.name} quantity={item.quantity} max={item.maxQuantity} />
              <p className="w-24 text-right font-semibold" data-testid="line-total">
                {formatPrice(item.lineTotalCents)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-labelledby="summary-title" className="flex flex-col gap-4 self-start rounded-2xl bg-white p-4">
        <h2 id="summary-title" className="text-xl font-bold">
          Resumen
        </h2>
        <CouponForm current={cart.coupon?.code ?? null} />
        {cart.coupon && !cart.coupon.applied && (
          <p role="alert" data-testid="coupon-warning" className="rounded-lg bg-store-terracotta/10 p-2 text-sm">
            El cupón {cart.coupon.code} no se aplica: {cart.coupon.reason}
          </p>
        )}
        <dl className="flex flex-col gap-1">
          <Row label="Subtotal" cents={t.subtotalCents} testId="total-subtotal" />
          <Row label={cart.coupon?.applied ? `Descuento (${cart.coupon.code})` : 'Descuento'} cents={t.discountCents === 0 ? 0 : -t.discountCents} testId="total-discount" />
          <Row label="Envío" cents={t.shippingCents} testId="total-shipping" />
          <Row label="Total" cents={t.totalCents} testId="total-total" strong />
          <div className="flex justify-between text-sm text-store-muted">
            <dt>IVA incluido</dt>
            <dd data-testid="total-vat">{formatPrice(t.vatIncludedCents)}</dd>
          </div>
        </dl>
        {t.shippingCents > 0 && (
          <p className="text-sm text-store-muted" data-testid="free-shipping-hint">
            Te faltan {formatPrice(missing)} para el envío gratis.
          </p>
        )}
        <Link href="/checkout" className="rounded-lg bg-store-terracotta px-4 py-3 text-center font-semibold text-white hover:bg-store-terracotta-dark">
          Tramitar pedido
        </Link>
      </aside>
    </main>
  )
}
