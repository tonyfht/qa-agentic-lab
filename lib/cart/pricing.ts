import { formatPrice } from '@/lib/catalog/query'

export const SHIPPING_CENTS = 495
export const FREE_SHIPPING_FROM_CENTS = 5000
export const MAX_PER_LINE = 10
export const VAT_RATE = 0.21

export interface PricedLine {
  slug: string
  category: string
  priceCents: number
  quantity: number
}

export interface Coupon {
  code: string
  kind: 'percent' | 'fixed' | 'shipping'
  value: number
  minSubtotalCents: number
  category: string | null
  categoryName?: string
  validUntil: string
}

export interface CouponStatus {
  code: string
  applied: boolean
  reason?: string
}

export interface Totals {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
  vatIncludedCents: number
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

const dateEs = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Checks a coupon in the order fixed by PROMO-002 and returns the first failing reason, or null when it applies:
 * exists → still valid → something it applies to → minimum reached.
 */
export function couponProblem(code: string, coupon: Coupon | null, lines: PricedLine[], now: Date): string | null {
  if (!coupon) return `El cupón ${normalizeCode(code)} no existe`
  if (now.getTime() > Date.parse(`${coupon.validUntil}T23:59:59.999Z`)) {
    return `El cupón ${coupon.code} caducó el ${dateEs(coupon.validUntil)}`
  }
  if (coupon.category && !lines.some((l) => l.category === coupon.category)) {
    return `${coupon.code} solo se aplica a artículos de ${coupon.categoryName ?? coupon.category}`
  }
  const subtotal = lines.reduce((s, l) => s + l.priceCents * l.quantity, 0)
  if (subtotal < coupon.minSubtotalCents) {
    return `${coupon.code} necesita una compra mínima de ${formatPrice(coupon.minSubtotalCents)}`
  }
  return null
}

/**
 * Prices a cart in cents (CART-005, PROMO-001…004). Pure: the API, the page and the tests use the same function.
 * Rounding happens in exactly two places: the percentage discount and the included VAT, both to the nearest cent.
 */
export function priceCart(lines: PricedLine[], coupon: Coupon | null, couponCode: string | null, now: Date) {
  const subtotalCents = lines.reduce((s, l) => s + l.priceCents * l.quantity, 0)
  let discountCents = 0
  let couponStatus: CouponStatus | null = null
  let freeShippingByCoupon = false

  if (couponCode) {
    const problem = couponProblem(couponCode, coupon, lines, now)
    couponStatus = { code: coupon?.code ?? normalizeCode(couponCode), applied: problem === null, ...(problem ? { reason: problem } : {}) }
    if (!problem && coupon) {
      if (coupon.kind === 'percent') {
        const base = coupon.category
          ? lines.filter((l) => l.category === coupon.category).reduce((s, l) => s + l.priceCents * l.quantity, 0)
          : subtotalCents
        discountCents = Math.round((base * coupon.value) / 100)
      } else if (coupon.kind === 'fixed') {
        discountCents = Math.min(coupon.value, subtotalCents)
      } else {
        freeShippingByCoupon = true
      }
    }
  }

  const afterDiscount = subtotalCents - discountCents
  const shippingCents =
    lines.length === 0 || freeShippingByCoupon || afterDiscount >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS
  const totalCents = afterDiscount + shippingCents
  const vatIncludedCents = totalCents - Math.round(totalCents / (1 + VAT_RATE))

  const totals: Totals = { subtotalCents, discountCents, shippingCents, totalCents, vatIncludedCents }
  return { totals, coupon: couponStatus }
}

/** Highest quantity a line may have (CART-002). */
export function maxQuantity(stock: number): number {
  return Math.min(stock, MAX_PER_LINE)
}

/** Validates a requested quantity; returns the error to show, or null (CART-002). */
export function quantityProblem(quantity: unknown, stock: number): { status: 400 | 409; message: string } | null {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
    return { status: 400, message: 'La cantidad debe ser un número entero mayor que cero' }
  }
  if (stock === 0) return { status: 409, message: 'Este artículo está agotado' }
  if (quantity > MAX_PER_LINE && stock > MAX_PER_LINE) {
    return { status: 409, message: `El máximo es de ${MAX_PER_LINE} unidades por artículo` }
  }
  if (quantity > maxQuantity(stock)) {
    return { status: 409, message: `Solo puedes tener ${maxQuantity(stock)} unidades de este artículo` }
  }
  return null
}
