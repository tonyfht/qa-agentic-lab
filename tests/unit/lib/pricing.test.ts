import { describe, expect, it } from 'vitest'
import { couponProblem, priceCart, quantityProblem, maxQuantity, type Coupon, type PricedLine } from '@/lib/cart/pricing'
import { coupons as seedCoupons } from '@/lib/db/seed-data'

const now = new Date('2026-10-21T12:00:00Z')
const coupon = (code: string): Coupon => {
  const c = seedCoupons.find((k) => k.code === code)!
  return { ...c, categoryName: c.category === 'textil' ? 'Textil' : undefined }
}
const line = (priceCents: number, quantity = 1, category = 'cocina', slug = `p${priceCents}`): PricedLine => ({
  slug,
  category,
  priceCents,
  quantity,
})
const price = (lines: PricedLine[], code: string | null = null) =>
  priceCart(lines, code ? coupon(code) : null, code, now)

describe('CART-005 Totales del carrito', () => {
  it('dos unidades de 19,90 €: subtotal 39,80, envío 4,95, total 44,75 e IVA 7,77', () => {
    expect(price([line(1990, 2)]).totals).toEqual({
      subtotalCents: 3980,
      discountCents: 0,
      shippingCents: 495,
      totalCents: 4475,
      vatIncludedCents: 777,
    })
  })

  it('un carrito vacío no tiene ningún importe, tampoco envío', () => {
    expect(price([]).totals).toEqual({ subtotalCents: 0, discountCents: 0, shippingCents: 0, totalCents: 0, vatIncludedCents: 0 })
  })
})

describe('PROMO-003 Envío gratis', () => {
  it.each([
    [4999, 495],
    [5000, 0],
    [5001, 0],
  ])('con %i céntimos tras el descuento, el envío cuesta %i', (amount, shipping) => {
    expect(price([line(amount)]).totals.shippingCents).toBe(shipping)
  })

  it('el descuento puede hacer bajar del umbral: 54,00 € con BIENVENIDA10 → 48,60 € y paga envío', () => {
    const { totals } = price([line(5400)], 'BIENVENIDA10')
    expect(totals.subtotalCents - totals.discountCents).toBe(4860)
    expect(totals.shippingCents).toBe(495)
  })

  it('ENVIOGRATIS quita el envío aunque no se llegue al umbral', () => {
    expect(price([line(990)], 'ENVIOGRATIS').totals).toMatchObject({ shippingCents: 0, discountCents: 0, totalCents: 990 })
  })
})

describe('PROMO-001 Aplicar un cupón', () => {
  it('BIENVENIDA10 con 40,00 € descuenta 4,00 €', () => {
    expect(price([line(4000)], 'BIENVENIDA10')).toMatchObject({
      totals: { discountCents: 400 },
      coupon: { code: 'BIENVENIDA10', applied: true },
    })
  })

  it('CASA5 descuenta 5,00 € fijos y nunca más que el subtotal', () => {
    expect(price([line(3000)], 'CASA5').totals.discountCents).toBe(500)
  })
})

describe('PROMO-002 Validación de cupones', () => {
  // Decision table: exists × valid × applicable × minimum → the first failing condition is reported.
  it.each([
    ['REGALO100', [line(9900)], 'El cupón REGALO100 no existe'],
    ['VERANO2026', [line(9900)], 'El cupón VERANO2026 caducó el 30/09/2026'],
    ['TEXTIL15', [line(9900, 1, 'cocina')], 'TEXTIL15 solo se aplica a artículos de Textil'],
    ['BIENVENIDA10', [line(2999)], 'BIENVENIDA10 necesita una compra mínima de 30,00 €'],
    ['BIENVENIDA10', [line(3000)], null],
  ])('%s → %s', (code, lines, reason) => {
    const k = seedCoupons.some((c) => c.code === code) ? coupon(code) : null
    const problem = couponProblem(code, k, lines, now)
    expect(problem?.replace(/\s/g, ' ') ?? null).toBe(reason)
  })

  it('se informa de la primera condición que falla: caducado antes que mínimo', () => {
    expect(couponProblem('VERANO2026', { ...coupon('VERANO2026'), minSubtotalCents: 10000 }, [line(100)], now)).toMatch(/caducó/)
  })

  it('el cupón vale todo el día de su fecha de caducidad', () => {
    expect(couponProblem('VERANO2026', coupon('VERANO2026'), [line(100)], new Date('2026-09-30T22:00:00Z'))).toBeNull()
  })

  it('un cupón guardado que deja de cumplir el mínimo no descuenta y explica por qué', () => {
    const r = price([line(2000)], 'BIENVENIDA10')
    expect(r.totals.discountCents).toBe(0)
    expect(r.coupon).toMatchObject({ applied: false })
    expect(r.coupon?.reason).toMatch(/compra mínima de 30,00/)
  })
})

describe('PROMO-004 Cupón por categoría', () => {
  it('TEXTIL15 descuenta solo sobre textil: 15 % de 19,90 € = 2,99 € (redondeado)', () => {
    expect(price([line(1990, 1, 'textil'), line(990, 1, 'cocina')], 'TEXTIL15').totals.discountCents).toBe(299)
  })

  it('sin líneas de textil el cupón no descuenta y lo explica', () => {
    const r = price([line(990, 1, 'cocina')], 'TEXTIL15')
    expect(r.totals.discountCents).toBe(0)
    expect(r.coupon?.reason).toMatch(/solo se aplica a artículos de Textil/)
  })
})

describe('CART-002 Límite de unidades', () => {
  it('el máximo es el stock, hasta 10', () => {
    expect(maxQuantity(3)).toBe(3)
    expect(maxQuantity(30)).toBe(10)
    expect(maxQuantity(0)).toBe(0)
  })

  it.each([
    [3, 3, null],
    [4, 3, 'Solo puedes tener 3 unidades de este artículo'],
    [10, 30, null],
    [11, 30, 'El máximo es de 10 unidades por artículo'],
    [1, 0, 'Este artículo está agotado'],
    [0, 5, 'La cantidad debe ser un número entero mayor que cero'],
    [1.5, 5, 'La cantidad debe ser un número entero mayor que cero'],
    ['2', 5, 'La cantidad debe ser un número entero mayor que cero'],
  ])('pedir %s con stock %i → %s', (quantity, stock, message) => {
    expect(quantityProblem(quantity, stock as number)?.message ?? null).toBe(message)
  })
})

describe('PROMO-002 Cupones de ejemplo', () => {
  it('cubren cada rama de la tabla de decisión: porcentaje, fijo, categoría, envío y caducado', () => {
    expect(seedCoupons.map((c) => c.code)).toEqual(['BIENVENIDA10', 'CASA5', 'TEXTIL15', 'ENVIOGRATIS', 'VERANO2026'])
    expect(seedCoupons.find((c) => c.code === 'VERANO2026')?.validUntil).toBe('2026-09-30')
    expect(seedCoupons.find((c) => c.code === 'TEXTIL15')?.category).toBe('textil')
  })
})
