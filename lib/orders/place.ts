import { getCart } from '@/lib/cart/repository'
import { charge, type PaymentInput } from '@/lib/checkout/payment'
import { validateShipping } from '@/lib/checkout/shipping'
import { getDb } from '@/lib/db/client'
import { getOrder, type Order } from './repository'

export class CheckoutError extends Error {
  constructor(
    readonly status: 400 | 402 | 409,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message)
  }
}

export function orderNumber(id: number): string {
  return `TC-${String(id).padStart(6, '0')}`
}

/**
 * Places an order (CHK-001…005). Checks run in a fixed order: empty cart → shipping → card → stock. The stock check,
 * the order and the emptied cart happen in one write transaction: either everything happens or nothing does.
 */
export async function placeOrder(
  userId: number,
  cartId: string | null,
  body: { shipping?: unknown; payment?: Partial<PaymentInput> },
  now = new Date(),
): Promise<Order> {
  const cart = await getCart(cartId, now)
  if (!cartId || cart.items.length === 0) throw new CheckoutError(400, 'Tu carrito está vacío')

  const shipping = validateShipping(body.shipping)
  if (!shipping.value) throw new CheckoutError(400, 'Revisa los datos de envío', shipping.fields)

  const payment = charge(
    { cardNumber: String(body.payment?.cardNumber ?? ''), expiry: String(body.payment?.expiry ?? ''), cvc: String(body.payment?.cvc ?? '') },
    now,
  )
  if (!payment.ok) {
    throw new CheckoutError(payment.status, payment.message, payment.field ? { [payment.field]: payment.message } : undefined)
  }

  const db = await getDb()
  const tx = await db.transaction('write')
  try {
    for (const item of cart.items) {
      const updated = await tx.execute({
        sql: 'UPDATE products SET stock = stock - ? WHERE slug = ? AND stock >= ?',
        args: [item.quantity, item.slug, item.quantity],
      })
      if (updated.rowsAffected === 0) {
        const { rows } = await tx.execute({ sql: 'SELECT stock FROM products WHERE slug = ?', args: [item.slug] })
        const left = Number(rows[0]?.stock ?? 0)
        throw new CheckoutError(409, `De «${item.name}» solo ${left === 1 ? 'queda 1 unidad' : `quedan ${left} unidades`}`)
      }
    }
    const t = cart.totals
    const s = shipping.value
    const inserted = await tx.execute({
      sql: `INSERT INTO orders (user_id, created_at, status, subtotal_cents, discount_cents, shipping_cents, total_cents,
              vat_included_cents, coupon_code, ship_name, ship_address, ship_city, ship_postal_code, card_brand, card_last4)
            VALUES (?, ?, 'pagado', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        now.toISOString(),
        t.subtotalCents,
        t.discountCents,
        t.shippingCents,
        t.totalCents,
        t.vatIncludedCents,
        cart.coupon?.applied ? cart.coupon.code : null,
        s.fullName,
        s.address,
        s.city,
        s.postalCode,
        payment.brand,
        payment.last4,
      ],
    })
    const orderId = Number(inserted.lastInsertRowid)
    for (const item of cart.items) {
      await tx.execute({
        sql: 'INSERT INTO order_lines (order_id, slug, name, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?)',
        args: [orderId, item.slug, item.name, item.priceCents, item.quantity],
      })
    }
    await tx.execute({ sql: 'DELETE FROM cart_items WHERE cart_id = ?', args: [cartId] })
    await tx.execute({ sql: 'UPDATE carts SET coupon_code = NULL WHERE id = ?', args: [cartId] })
    await tx.commit()
    return (await getOrder(userId, orderNumber(orderId)))!
  } catch (error) {
    await tx.rollback()
    throw error
  } finally {
    tx.close()
  }
}
