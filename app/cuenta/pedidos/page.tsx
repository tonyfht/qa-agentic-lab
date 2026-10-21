import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePageAccount } from '@/lib/account/guard'
import { formatPrice } from '@/lib/catalog/query'
import { listOrders } from '@/lib/orders/repository'

export const metadata: Metadata = { title: 'Mis pedidos' }
export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const account = await requirePageAccount('/cuenta/pedidos')
  const orders = await listOrders(account.id)
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Mis pedidos</h1>
      {orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-6">
          <span>Todavía no has hecho ningún pedido.</span>{' '}
          <Link href="/catalogo" className="underline">
            Ver el catálogo
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Pedidos">
          {orders.map((o) => (
            <li key={o.number} data-testid="order-row" className="rounded-2xl bg-white p-4">
              <Link href={`/cuenta/pedidos/${o.number}`} className="flex flex-wrap justify-between gap-2">
                <span className="font-semibold">{o.number}</span>
                <span>{new Date(o.createdAt).toLocaleDateString('es-ES')}</span>
                <span>{o.units} {o.units === 1 ? 'unidad' : 'unidades'}</span>
                <span className="font-bold">{formatPrice(o.totalCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
