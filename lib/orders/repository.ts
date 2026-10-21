import { getDb } from '@/lib/db/client'

export interface OrderSummary {
  number: string
  createdAt: string
  status: string
  units: number
  totalCents: number
}

export interface Order extends OrderSummary {
  lines: { slug: string; name: string; unitPriceCents: number; quantity: number; lineTotalCents: number }[]
  totals: { subtotalCents: number; discountCents: number; shippingCents: number; totalCents: number; vatIncludedCents: number }
  couponCode: string | null
  shipping: { fullName: string; address: string; city: string; postalCode: string }
  card: { brand: string; last4: string }
}

const idFromNumber = (number: string): number | null => {
  const m = /^TC-(\d{6})$/.exec(number)
  return m ? Number(m[1]) : null
}

/** ORD-001: the customer's own orders, newest first. */
export async function listOrders(userId: number): Promise<OrderSummary[]> {
  const db = await getDb()
  const { rows } = await db.execute({
    sql: `SELECT o.id, o.created_at, o.status, o.total_cents, COALESCE(SUM(l.quantity), 0) AS units
            FROM orders o LEFT JOIN order_lines l ON l.order_id = o.id
           WHERE o.user_id = ? GROUP BY o.id ORDER BY o.id DESC`,
    args: [userId],
  })
  return rows.map((r) => ({
    number: `TC-${String(r.id).padStart(6, '0')}`,
    createdAt: String(r.created_at),
    status: String(r.status),
    units: Number(r.units),
    totalCents: Number(r.total_cents),
  }))
}

/**
 * ORD-002/003: an order of another customer is looked up with the owner in the WHERE clause, so it is simply "not
 * found" — the same answer as a number that does not exist.
 */
export async function getOrder(userId: number, number: string): Promise<Order | null> {
  const id = idFromNumber(number)
  if (id === null) return null
  const db = await getDb()
  const { rows } = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ? AND user_id = ?', args: [id, userId] })
  const o = rows[0]
  if (!o) return null
  const lines = (await db.execute({ sql: 'SELECT * FROM order_lines WHERE order_id = ? ORDER BY name', args: [id] })).rows
  return {
    number,
    createdAt: String(o.created_at),
    status: String(o.status),
    units: lines.reduce((n, l) => n + Number(l.quantity), 0),
    totalCents: Number(o.total_cents),
    lines: lines.map((l) => ({
      slug: String(l.slug),
      name: String(l.name),
      unitPriceCents: Number(l.unit_price_cents),
      quantity: Number(l.quantity),
      lineTotalCents: Number(l.unit_price_cents) * Number(l.quantity),
    })),
    totals: {
      subtotalCents: Number(o.subtotal_cents),
      discountCents: Number(o.discount_cents),
      shippingCents: Number(o.shipping_cents),
      totalCents: Number(o.total_cents),
      vatIncludedCents: Number(o.vat_included_cents),
    },
    couponCode: o.coupon_code === null ? null : String(o.coupon_code),
    shipping: {
      fullName: String(o.ship_name),
      address: String(o.ship_address),
      city: String(o.ship_city),
      postalCode: String(o.ship_postal_code),
    },
    card: { brand: String(o.card_brand), last4: String(o.card_last4) },
  }
}
