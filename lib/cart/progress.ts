import { FREE_SHIPPING_FROM_CENTS } from './pricing'

export interface FreeShippingProgress {
  /** 0..100, rounded down so the bar never shows 100 % before it is reached. */
  percent: number
  missingCents: number
  reached: boolean
}

/** Progress towards free shipping on the subtotal after discount (PROMO-005, rule in PROMO-003). */
export function freeShippingProgress(totals: { subtotalCents: number; discountCents: number; shippingCents: number }): FreeShippingProgress {
  const base = Math.max(0, totals.subtotalCents - totals.discountCents)
  // A free-shipping coupon also reaches it, whatever the amount.
  const reached = base >= FREE_SHIPPING_FROM_CENTS || (base > 0 && totals.shippingCents === 0)
  if (reached) return { percent: 100, missingCents: 0, reached }
  return { percent: Math.floor((base / FREE_SHIPPING_FROM_CENTS) * 100), missingCents: FREE_SHIPPING_FROM_CENTS - base, reached }
}
