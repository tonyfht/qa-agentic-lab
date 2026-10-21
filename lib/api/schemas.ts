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
