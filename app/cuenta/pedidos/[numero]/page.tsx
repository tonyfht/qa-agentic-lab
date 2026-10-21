import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckoutSteps } from '@/app/_components/CheckoutSteps'
import { requirePageAccount } from '@/lib/account/guard'
import { formatPrice } from '@/lib/catalog/query'
import { getOrder } from '@/lib/orders/repository'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ numero: string }>; searchParams: Promise<{ nuevo?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Pedido ${(await params).numero}` }
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { numero } = await params
  const account = await requirePageAccount(`/cuenta/pedidos/${numero}`)
  const order = await getOrder(account.id, numero)
  if (!order) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-4xl font-semibold">Este pedido no existe</h1>
        <Link href="/cuenta/pedidos" className="mt-4 inline-block underline">
          Ver mis pedidos
        </Link>
      </main>
    )
  }
  const t = order.totals
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {(await searchParams).nuevo && (
        <>
          <CheckoutSteps current="Confirmación" />
          <p role="status" className="mb-6 rounded-2xl bg-store-olive p-5 text-lg font-semibold text-white" data-testid="order-thanks">
            Gracias por tu pedido. Tu número es {order.number}.
          </p>
        </>
      )}
      <h1 className="mb-1 text-4xl font-semibold">Pedido {order.number}</h1>
      <p className="mb-6 text-store-muted">
        {new Date(order.createdAt).toLocaleString('es-ES')} · {order.status}
      </p>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-store-ink/10 bg-white p-5">
          <h2 className="mb-2 font-semibold">Artículos</h2>
          <ul className="flex flex-col gap-1">
            {order.lines.map((l) => (
              <li key={l.slug} className="flex justify-between gap-2" data-testid="order-line">
                <span>
                  {l.quantity} × {l.name}
                </span>
                <span>{formatPrice(l.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1 border-t border-store-ink/10 pt-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(t.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt>Descuento{order.couponCode ? ` (${order.couponCode})` : ''}</dt><dd>{formatPrice(t.discountCents === 0 ? 0 : -t.discountCents)}</dd></div>
            <div className="flex justify-between"><dt>Envío</dt><dd>{formatPrice(t.shippingCents)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd data-testid="order-total">{formatPrice(t.totalCents)}</dd></div>
          </dl>
        </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-store-ink/10 bg-white p-5">
          <div>
            <h2 className="mb-1 font-semibold">Envío</h2>
            <p>
              {order.shipping.fullName}
              <br />
              {order.shipping.address}
              <br />
              {order.shipping.postalCode} {order.shipping.city}
            </p>
          </div>
          <div>
            <h2 className="mb-1 font-semibold">Pago</h2>
            <p data-testid="order-card">Tarjeta de prueba •••• {order.card.last4}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
