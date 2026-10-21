import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { SORTS } from '@/lib/catalog/types'

extendZodWithOpenApi(z)

export const HealthResponse = z
  .object({
    status: z.literal('ok').openapi({ description: 'La aplicación está operativa' }),
    version: z.string().openapi({ example: '0.1.0', description: 'Versión desplegada de la tienda' }),
  })
  .openapi('HealthResponse')

export const ApiError = z
  .object({
    error: z.string().openapi({ example: 'Parámetros no válidos' }),
    details: z.array(z.string()).optional().openapi({ example: ['El precio mínimo no puede ser mayor que el máximo'] }),
    fields: z.record(z.string(), z.string()).optional().openapi({ description: 'Error por campo del formulario', example: { postalCode: 'El código postal debe tener 5 dígitos' } }),
  })
  .openapi('ApiError')

export const Product = z
  .object({
    slug: z.string().openapi({ example: 'manta-punto-gruesa' }),
    name: z.string().openapi({ example: 'Manta de punto gruesa' }),
    description: z.string(),
    category: z.string().openapi({ example: 'textil' }),
    categoryName: z.string().openapi({ example: 'Textil' }),
    priceCents: z.number().int().nonnegative().openapi({ example: 1990, description: 'Precio en céntimos de euro' }),
    stock: z.number().int().nonnegative(),
    rating: z.number().min(0).max(5),
    isNew: z.boolean(),
  })
  .openapi('Product')

export const ProductList = z
  .object({
    items: z.array(Product),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageCount: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
  .openapi('ProductList')

export const Category = z
  .object({
    slug: z.string().openapi({ example: 'textil' }),
    name: z.string().openapi({ example: 'Textil' }),
    count: z.number().int().nonnegative(),
  })
  .openapi('Category')

export const CatalogQueryParams = z.object({
  q: z.string().optional().openapi({ description: 'Texto a buscar en nombre y descripción (sin distinguir tildes)' }),
  category: z.string().optional().openapi({ description: 'Slug de la categoría', example: 'cocina' }),
  minPrice: z.string().optional().openapi({ description: 'Precio mínimo en euros, incluido', example: '10' }),
  maxPrice: z.string().optional().openapi({ description: 'Precio máximo en euros, incluido', example: '19,90' }),
  inStock: z.enum(['1', 'true', 'on']).optional().openapi({ description: 'Solo artículos con stock' }),
  sort: z.enum(SORTS).optional().openapi({ description: 'Criterio de orden' }),
  page: z.string().optional().openapi({ description: 'Página, desde 1', example: '1' }),
})

export type HealthResponse = z.infer<typeof HealthResponse>
export type ApiError = z.infer<typeof ApiError>

export const CartItem = z
  .object({
    slug: z.string(),
    name: z.string(),
    category: z.string(),
    priceCents: z.number().int().nonnegative(),
    quantity: z.number().int().positive(),
    maxQuantity: z.number().int().nonnegative().openapi({ description: 'Máximo permitido: el stock, hasta 10' }),
    lineTotalCents: z.number().int().nonnegative(),
  })
  .openapi('CartItem')

export const CartTotals = z
  .object({
    subtotalCents: z.number().int().nonnegative(),
    discountCents: z.number().int().nonnegative(),
    shippingCents: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
    vatIncludedCents: z.number().int().nonnegative().openapi({ description: 'IVA (21 %) incluido en el total' }),
  })
  .openapi('CartTotals')

export const CouponStatus = z
  .object({
    code: z.string().openapi({ example: 'BIENVENIDA10' }),
    applied: z.boolean(),
    reason: z.string().optional().openapi({ description: 'Por qué no descuenta, si no se aplica' }),
  })
  .openapi('CouponStatus')

export const Cart = z
  .object({
    items: z.array(CartItem),
    units: z.number().int().nonnegative(),
    totals: CartTotals,
    coupon: CouponStatus.nullable(),
  })
  .openapi('Cart')

export const AddItemBody = z.object({
  slug: z.string().openapi({ example: 'manta-punto-gruesa' }),
  quantity: z.number().int().openapi({ example: 2 }),
})
export const QuantityBody = z.object({ quantity: z.number().int().openapi({ example: 3, description: '0 elimina la línea' }) })
export const CouponBody = z.object({ code: z.string().openapi({ example: 'BIENVENIDA10' }) })

export const Account = z
  .object({ name: z.string().openapi({ example: 'Ana' }), email: z.string().openapi({ example: 'ana@ejemplo.test' }) })
  .openapi('Account')
export const RegisterBody = z.object({
  name: z.string().openapi({ example: 'Ana' }),
  email: z.string().openapi({ example: 'ana@ejemplo.test' }),
  password: z.string().openapi({ example: 'Casa2026', description: '8+ caracteres con al menos una letra y un número' }),
})
export const LoginBody = z.object({
  email: z.string().openapi({ example: 'cliente@ejemplo.test' }),
  password: z.string().openapi({ example: 'Casa2026' }),
})
export const OkResponse = z.object({ status: z.literal('ok') }).openapi('OkResponse')

export const ShippingData = z
  .object({
    fullName: z.string().openapi({ example: 'Ana García' }),
    address: z.string().openapi({ example: 'Calle Mayor 1' }),
    city: z.string().openapi({ example: 'Madrid' }),
    postalCode: z.string().openapi({ example: '28013' }),
  })
  .openapi('ShippingData')

export const CheckoutBody = z.object({
  shipping: ShippingData,
  payment: z.object({
    cardNumber: z.string().openapi({ example: '4242 4242 4242 4242', description: 'Tarjetas de prueba: ver README' }),
    expiry: z.string().openapi({ example: '12/30', description: 'MM/AA' }),
    cvc: z.string().openapi({ example: '123' }),
  }),
})

export const OrderSummary = z
  .object({
    number: z.string().openapi({ example: 'TC-000001' }),
    createdAt: z.iso.datetime(),
    status: z.string().openapi({ example: 'pagado' }),
    units: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
  })
  .openapi('OrderSummary')

export const Order = OrderSummary.extend({
  lines: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      unitPriceCents: z.number().int().nonnegative(),
      quantity: z.number().int().positive(),
      lineTotalCents: z.number().int().nonnegative(),
    }),
  ),
  totals: CartTotals,
  couponCode: z.string().nullable(),
  shipping: ShippingData,
  card: z.object({
    brand: z.string().openapi({ example: 'test' }),
    last4: z.string().regex(/^\d{4}$/).openapi({ example: '4242', description: 'Solo los 4 últimos dígitos (CHK-005)' }),
  }),
}).openapi('Order')
