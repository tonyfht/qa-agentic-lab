import { describe, expect, it } from 'vitest'
import { freeShippingProgress } from '@/lib/cart/progress'

describe('PROMO-005 Progreso hacia el envío gratis', () => {
  it('a medio camino: 25,00 € de 50,00 € es el 50 % y faltan 25,00 €', () => {
    expect(freeShippingProgress({ subtotalCents: 2500, discountCents: 0, shippingCents: 495 })).toEqual({ percent: 50, missingCents: 2500, reached: false })
  })

  it('cuenta el subtotal con descuento, como PROMO-003', () => {
    expect(freeShippingProgress({ subtotalCents: 5200, discountCents: 520, shippingCents: 495 })).toEqual({ percent: 93, missingCents: 320, reached: false })
  })

  it('justo en el umbral y por encima: 100 % y envío gratis', () => {
    expect(freeShippingProgress({ subtotalCents: 5000, discountCents: 0, shippingCents: 0 }).reached).toBe(true)
    expect(freeShippingProgress({ subtotalCents: 6000, discountCents: 0, shippingCents: 0 })).toEqual({ percent: 100, missingCents: 0, reached: true })
  })

  it('un céntimo por debajo nunca redondea a 100 %', () => {
    expect(freeShippingProgress({ subtotalCents: 4999, discountCents: 0, shippingCents: 495 }).percent).toBe(99)
  })

  it('el cupón de envío gratis lo alcanza con cualquier importe', () => {
    expect(freeShippingProgress({ subtotalCents: 1000, discountCents: 0, shippingCents: 0 }).reached).toBe(true)
  })
})
