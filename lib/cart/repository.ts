import { randomUUID } from 'node:crypto'
import { getDb } from '@/lib/db/client'
import { maxQuantity, normalizeCode, priceCart, quantityProblem, couponProblem, type Coupon } from './pricing'

export interface CartLine {
  slug: string
  name: string
  category: string
  priceCents: number
  quantity: number
  maxQuantity: number
  lineTotalCents: number
}

export interface CartView {
  items: CartLine[]
  units: number
  totals: ReturnType<typeof priceCart>['totals']
  coupon: ReturnType<typeof priceCart>['coupon']
}

export class CartError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message)
  }
}

async function loadCoupon(code: string): Promise<Coupon | null> {
  const db = await getDb()
  const { rows } = await db.execute({
    sql: `SELECT k.code, k.kind, k.value, k.min_subtotal_cents, k.category, c.name AS category_name, k.valid_until
            FROM coupons k LEFT JOIN categories c ON c.slug = k.category WHERE k.code = ?`,
    args: [normalizeCode(code)],
  })
  const r = rows[0]
  if (!r) return null
  return {
    code: String(r.code),
    kind: String(r.kind) as Coupon['kind'],
    value: Number(r.value),
    minSubtotalCents: Number(r.min_subtotal_cents),
    category: r.category === null ? null : String(r.category),
    categoryName: r.category_name === null ? undefined : String(r.category_name),
    validUntil: String(r.valid_until),
  }
}

async function loadLines(cartId: string): Promise<CartLine[]> {
  const db = await getDb()
  const { rows } = await db.execute({
    sql: `SELECT i.slug, p.name, p.category, p.price_cents, p.stock, i.quantity
            FROM cart_items i JOIN products p ON p.slug = i.slug WHERE i.cart_id = ? ORDER BY p.name`,
    args: [cartId],
  })
  return rows.map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    category: String(r.category),
    priceCents: Number(r.price_cents),
    quantity: Number(r.quantity),
    maxQuantity: maxQuantity(Number(r.stock)),
    lineTotalCents: Number(r.price_cents) * Number(r.quantity),
  }))
}

async function couponCodeOf(cartId: string): Promise<string | null> {
  const db = await getDb()
  const { rows } = await db.execute({ sql: 'SELECT coupon_code FROM carts WHERE id = ?', args: [cartId] })
  return rows[0]?.coupon_code ? String(rows[0].coupon_code) : null
}

/** The cart as the customer sees it. No cart id means an empty cart (nothing is created on read). */
export async function getCart(cartId: string | null, now = new Date()): Promise<CartView> {
  const lines = cartId ? await loadLines(cartId) : []
  const code = cartId ? await couponCodeOf(cartId) : null
  const coupon = code ? await loadCoupon(code) : null
  const { totals, coupon: status } = priceCart(lines, coupon, code, now)
  return { items: lines, units: lines.reduce((n, l) => n + l.quantity, 0), totals, coupon: status }
}

async function ensureCart(cartId: string | null): Promise<string> {
  const db = await getDb()
  if (cartId) {
    const { rows } = await db.execute({ sql: 'SELECT 1 FROM carts WHERE id = ?', args: [cartId] })
    if (rows.length) return cartId
  }
  const id = randomUUID()
  await db.execute({ sql: 'INSERT INTO carts (id, created_at) VALUES (?, ?)', args: [id, new Date().toISOString()] })
  return id
}

async function stockOf(slug: string): Promise<number> {
  const db = await getDb()
  const { rows } = await db.execute({ sql: 'SELECT stock FROM products WHERE slug = ?', args: [slug] })
  if (!rows.length) throw new CartError(404, `El artículo «${slug}» no existe`)
  return Number(rows[0].stock)
}

async function currentQuantity(cartId: string, slug: string): Promise<number> {
  const db = await getDb()
  const { rows } = await db.execute({
    sql: 'SELECT quantity FROM cart_items WHERE cart_id = ? AND slug = ?',
    args: [cartId, slug],
  })
  return rows.length ? Number(rows[0].quantity) : 0
}

/** CART-001/002: adds to an existing line or creates it, never beyond the limits. */
export async function addItem(cartId: string | null, slug: string, quantity: unknown): Promise<string> {
  const stock = await stockOf(slug)
  const basic = quantityProblem(quantity, stock)
  if (basic) throw new CartError(basic.status, basic.message)
  const id = await ensureCart(cartId)
  const total = (await currentQuantity(id, slug)) + (quantity as number)
  const problem = quantityProblem(total, stock)
  if (problem) throw new CartError(problem.status, problem.message)
  const db = await getDb()
  await db.execute({
    sql: `INSERT INTO cart_items (cart_id, slug, quantity) VALUES (?, ?, ?)
          ON CONFLICT(cart_id, slug) DO UPDATE SET quantity = excluded.quantity`,
    args: [id, slug, total],
  })
  return id
}

/** CART-003: changes a line; 0 removes it. */
export async function setQuantity(cartId: string | null, slug: string, quantity: unknown): Promise<void> {
  if (!cartId || (await currentQuantity(cartId, slug)) === 0) {
    throw new CartError(404, `«${slug}» no está en el carrito`)
  }
  if (quantity === 0) return removeItem(cartId, slug)
  const problem = quantityProblem(quantity, await stockOf(slug))
  if (problem) throw new CartError(problem.status, problem.message)
  const db = await getDb()
  await db.execute({
    sql: 'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND slug = ?',
    args: [quantity as number, cartId, slug],
  })
}

export async function removeItem(cartId: string | null, slug: string): Promise<void> {
  if (!cartId || (await currentQuantity(cartId, slug)) === 0) {
    throw new CartError(404, `«${slug}» no está en el carrito`)
  }
  const db = await getDb()
  await db.execute({ sql: 'DELETE FROM cart_items WHERE cart_id = ? AND slug = ?', args: [cartId, slug] })
}

/** PROMO-001/002: validated against the current cart before it is saved; a rejected coupon is not stored. */
export async function applyCoupon(cartId: string | null, code: unknown, now = new Date()): Promise<string> {
  if (typeof code !== 'string' || !code.trim()) throw new CartError(400, 'Escribe un código de cupón')
  const coupon = await loadCoupon(code)
  const lines = cartId ? await loadLines(cartId) : []
  const problem = couponProblem(code, coupon, lines, now)
  if (problem) throw new CartError(400, problem)
  const id = await ensureCart(cartId)
  const db = await getDb()
  await db.execute({ sql: 'UPDATE carts SET coupon_code = ? WHERE id = ?', args: [coupon!.code, id] })
  return id
}

export async function removeCoupon(cartId: string | null): Promise<void> {
  if (!cartId) return
  const db = await getDb()
  await db.execute({ sql: 'UPDATE carts SET coupon_code = NULL WHERE id = ?', args: [cartId] })
}
