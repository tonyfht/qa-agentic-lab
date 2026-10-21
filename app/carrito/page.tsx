import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckoutSteps } from '@/app/_components/CheckoutSteps'
import { ProductCard } from '@/app/_components/ProductCard'
import { ProductImage } from '@/app/_components/ProductImage'
import { LockIcon, TruckIcon } from '@/app/_components/icons'
import { freeShippingProgress } from '@/lib/cart/progress'
import { getCart } from '@/lib/cart/repository'
import { readCartId } from '@/lib/cart/session'
import { topRated } from '@/lib/catalog/merchandising'
import { formatPrice } from '@/lib/catalog/query'
import { listProducts } from '@/lib/catalog/repository'
import { CouponForm, LineControls } from './CartControls'

export const metadata: Metadata = { title: 'Carrito' }
export const dynamic = 'force-dynamic'

function Row({ label, cents, testId, strong }: { label: string; cents: number; testId: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'border-t border-store-ink/10 pt-3 text-lg font-semibold' : ''}`}>
      <dt>{label}</dt>
      <dd data-testid={testId}>{formatPrice(cents)}</dd>
    </div>
  )
}

export default async function CartPage() {
  const cart = await getCart(await readCartId())
  const t = cart.totals

  // CART-007: an empty cart explains itself and suggests the best rated products that can be bought.
  if (cart.items.length === 0) {
    const suggestions = topRated(await listProducts(), 4)
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-semibold">Tu carrito está vacío</h1>
          <p className="text-store-muted">Añade artículos desde el catálogo o empieza por los favoritos de nuestros clientes.</p>
          <Link href="/catalogo" className="mt-2 rounded-full bg-store-terracotta px-6 py-3 font-semibold text-white hover:bg-store-terracotta-dark">
            Ir al catálogo
          </Link>
        </div>
        <section aria-labelledby="suggest-title" data-testid="cart-suggestions">
          <h2 id="suggest-title" className="mb-6 text-2xl font-semibold">
            Los favoritos de nuestros clientes
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </ul>
        </section>
      </main>
    )
  }

  const progress = freeShippingProgress(t)
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <CheckoutSteps current="Carrito" />
      <div className="grid gap-8 md:grid-cols-[1fr_360px]">
        <section aria-labelledby="cart-title">
          <h1 id="cart-title" className="mb-5 text-4xl font-semibold">
            Carrito
          </h1>

          {/* PROMO-005: progress towards free shipping (rule in PROMO-003). */}
          <div className="mb-5 rounded-2xl border border-store-ink/10 bg-white p-4" data-testid="free-shipping-progress">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <TruckIcon className="size-5 text-store-terracotta-dark" />
              {progress.reached ? (
                <span data-testid="free-shipping-reached">Tienes envío gratis</span>
              ) : (
                <span data-testid="free-shipping-hint">Te faltan {formatPrice(progress.missingCents)} para el envío gratis.</span>
              )}
            </p>
            <div
              role="progressbar"
              aria-label="Progreso hacia el envío gratis"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
              aria-valuetext={`${progress.percent} %`}
              className="h-2 overflow-hidden rounded-full bg-store-sand"
            >
              <div className={`h-full rounded-full ${progress.reached ? 'bg-store-olive' : 'bg-store-terracotta'}`} style={{ width: `${progress.percent}%` }} />
            </div>
          </div>

          <ul className="flex flex-col gap-3" aria-label="Artículos del carrito">
            {cart.items.map((item) => (
              <li key={item.slug} data-testid="cart-line" data-slug={item.slug} className="flex items-center gap-4 rounded-2xl border border-store-ink/10 bg-white p-3">
                <div className="w-20 shrink-0 overflow-hidden rounded-xl bg-store-sand">
                  <ProductImage slug={item.slug} name={item.name} category={item.category} sizes="80px" />
                </div>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/producto/${item.slug}`} className="font-medium hover:underline">
                      {item.name}
                    </Link>
                    <p className="text-sm text-store-muted">{formatPrice(item.priceCents)} / unidad</p>
                  </div>
                  <LineControls slug={item.slug} name={item.name} quantity={item.quantity} max={item.maxQuantity} />
                  <p className="w-24 text-right font-semibold" data-testid="line-total">
                    {formatPrice(item.lineTotalCents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside aria-labelledby="summary-title" className="flex flex-col gap-4 self-start rounded-2xl border border-store-ink/10 bg-white p-5 md:sticky md:top-4">
          <h2 id="summary-title" className="text-2xl font-semibold">
            Resumen
          </h2>
          <CouponForm current={cart.coupon?.code ?? null} />
          {cart.coupon && !cart.coupon.applied && (
            <p role="alert" data-testid="coupon-warning" className="rounded-xl bg-store-terracotta/10 p-3 text-sm">
              El cupón {cart.coupon.code} no se aplica: {cart.coupon.reason}
            </p>
          )}
          <dl className="flex flex-col gap-2">
            <Row label="Subtotal" cents={t.subtotalCents} testId="total-subtotal" />
            <Row label={cart.coupon?.applied ? `Descuento (${cart.coupon.code})` : 'Descuento'} cents={t.discountCents === 0 ? 0 : -t.discountCents} testId="total-discount" />
            <Row label="Envío" cents={t.shippingCents} testId="total-shipping" />
            <Row label="Total" cents={t.totalCents} testId="total-total" strong />
            <div className="flex justify-between text-sm text-store-muted">
              <dt>IVA incluido</dt>
              <dd data-testid="total-vat">{formatPrice(t.vatIncludedCents)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="rounded-full bg-store-terracotta px-4 py-3.5 text-center font-semibold text-white hover:bg-store-terracotta-dark">
            Tramitar pedido
          </Link>
          <p className="flex items-center justify-center gap-2 text-xs text-store-muted">
            <LockIcon className="size-4" /> Pago simulado: no se cobra nada
          </p>
        </aside>
      </div>
    </main>
  )
}
