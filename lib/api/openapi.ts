import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { appVersion } from '@/lib/version'
import {
  AddItemBody,
  ApiError,
  Cart,
  CatalogQueryParams,
  Category,
  CouponBody,
  HealthResponse,
  Product,
  ProductList,
  QuantityBody,
} from './schemas'

const json = (schema: z.ZodType, description: string) => ({ description, content: { 'application/json': { schema } } })

// The API contract is generated from the same Zod schemas the handlers use, so it cannot drift from the code.
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry()

  registry.registerPath({
    method: 'get',
    path: '/api/health',
    operationId: 'getHealth',
    summary: 'Estado de salud de la tienda',
    tags: ['Sistema'],
    responses: { 200: json(HealthResponse, 'La tienda está operativa') },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/products',
    operationId: 'listProducts',
    summary: 'Buscar, filtrar, ordenar y paginar el catálogo',
    tags: ['Catálogo'],
    request: { query: CatalogQueryParams },
    responses: {
      200: json(ProductList, 'Una página del catálogo'),
      400: json(ApiError, 'Parámetros no válidos, con el motivo de cada uno'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/products/{slug}',
    operationId: 'getProduct',
    summary: 'Ficha de un artículo',
    tags: ['Catálogo'],
    request: { params: z.object({ slug: z.string().openapi({ example: 'manta-punto-gruesa' }) }) },
    responses: {
      200: json(Product, 'El artículo'),
      404: json(ApiError, 'El artículo no existe'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/categories',
    operationId: 'listCategories',
    summary: 'Categorías con su número de artículos',
    tags: ['Catálogo'],
    responses: { 200: json(z.array(Category), 'Las categorías en el orden de la tienda') },
  })

  const body = (schema: z.ZodType) => ({ body: { content: { 'application/json': { schema } } } })
  const cartErrors = (...codes: (400 | 404 | 409)[]) =>
    Object.fromEntries(
      codes.map((c) => [
        c,
        json(ApiError, { 400: 'Petición no válida', 404: 'No encontrado', 409: 'Supera el stock o el máximo por artículo' }[c]),
      ]),
    )
  const slugParam = { params: z.object({ slug: z.string().openapi({ example: 'manta-punto-gruesa' }) }) }

  registry.registerPath({
    method: 'get',
    path: '/api/cart',
    operationId: 'getCart',
    summary: 'Carrito del navegador (cookie de sesión cart_id)',
    tags: ['Carrito'],
    responses: { 200: json(Cart, 'El carrito con sus totales; vacío si no hay cookie') },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/cart/items',
    operationId: 'addCartItem',
    summary: 'Añadir unidades de un artículo (se suman a las que ya hubiera)',
    tags: ['Carrito'],
    request: body(AddItemBody),
    responses: { 200: json(Cart, 'El carrito actualizado'), ...cartErrors(400, 404, 409) },
  })
  registry.registerPath({
    method: 'patch',
    path: '/api/cart/items/{slug}',
    operationId: 'setCartItemQuantity',
    summary: 'Cambiar la cantidad de una línea (0 la elimina)',
    tags: ['Carrito'],
    request: { ...slugParam, ...body(QuantityBody) },
    responses: { 200: json(Cart, 'El carrito actualizado'), ...cartErrors(400, 404, 409) },
  })
  registry.registerPath({
    method: 'delete',
    path: '/api/cart/items/{slug}',
    operationId: 'removeCartItem',
    summary: 'Eliminar una línea',
    tags: ['Carrito'],
    request: slugParam,
    responses: { 200: json(Cart, 'El carrito actualizado'), ...cartErrors(404) },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/cart/coupon',
    operationId: 'applyCoupon',
    summary: 'Aplicar un cupón (sustituye al anterior)',
    tags: ['Carrito'],
    request: body(CouponBody),
    responses: { 200: json(Cart, 'El carrito con el cupón'), ...cartErrors(400) },
  })
  registry.registerPath({
    method: 'delete',
    path: '/api/cart/coupon',
    operationId: 'removeCoupon',
    summary: 'Quitar el cupón',
    tags: ['Carrito'],
    responses: { 200: json(Cart, 'El carrito sin cupón') },
  })

  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'La Tienda en Casa — API',
      version: appVersion,
      description: 'API de la tienda de demostración de QA Agentic Lab.',
    },
  })
}
