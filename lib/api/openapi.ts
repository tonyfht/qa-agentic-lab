import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { appVersion } from '@/lib/version'
import {
  Account,
  AddItemBody,
  ApiError,
  Cart,
  CatalogQueryParams,
  Category,
  CheckoutBody,
  CouponBody,
  HealthResponse,
  LoginBody,
  OkResponse,
  Order,
  OrderSummary,
  Product,
  ProductList,
  QuantityBody,
  RegisterBody,
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

  const err = (description: string) => json(ApiError, description)
  const unauthorized = { 401: err('Sin sesión iniciada') }

  registry.registerPath({
    method: 'post',
    path: '/api/account/register',
    operationId: 'register',
    summary: 'Crear una cuenta (inicia la sesión)',
    tags: ['Cuenta'],
    request: body(RegisterBody),
    responses: { 201: json(Account, 'Cuenta creada'), 400: err('Datos no válidos (ver fields)'), 409: err('El correo ya existe') },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/account/login',
    operationId: 'login',
    summary: 'Iniciar sesión (cookie session, HttpOnly)',
    tags: ['Cuenta'],
    request: body(LoginBody),
    responses: { 200: json(Account, 'Sesión iniciada'), 400: err('Petición no válida'), 401: err('Correo o contraseña incorrectos') },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/account/logout',
    operationId: 'logout',
    summary: 'Cerrar la sesión',
    tags: ['Cuenta'],
    responses: { 200: json(OkResponse, 'Sesión cerrada') },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/account/me',
    operationId: 'me',
    summary: 'Cliente con la sesión iniciada',
    tags: ['Cuenta'],
    responses: { 200: json(Account, 'El cliente'), ...unauthorized },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/checkout',
    operationId: 'checkout',
    summary: 'Pagar el carrito con el pago simulado y crear el pedido',
    tags: ['Checkout'],
    request: body(CheckoutBody),
    responses: {
      201: json(Order, 'Pedido creado'),
      400: err('Carrito vacío o datos de envío o tarjeta no válidos (ver fields)'),
      ...unauthorized,
      402: err('Pago rechazado (tarjeta rechazada, fondos insuficientes o caducada)'),
      409: err('No hay stock suficiente de algún artículo'),
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/orders',
    operationId: 'listOrders',
    summary: 'Pedidos del cliente, del más reciente al más antiguo',
    tags: ['Pedidos'],
    responses: { 200: json(z.array(OrderSummary), 'Los pedidos'), ...unauthorized },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/orders/{number}',
    operationId: 'getOrder',
    summary: 'Detalle de un pedido propio',
    tags: ['Pedidos'],
    request: { params: z.object({ number: z.string().openapi({ example: 'TC-000001' }) }) },
    responses: { 200: json(Order, 'El pedido'), ...unauthorized, 404: err('No existe (o no es de este cliente)') },
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
