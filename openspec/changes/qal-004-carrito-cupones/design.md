# Design — QAL-004 Carrito, stock y cupones

## Context

Ver `proposal.md` y las specs `cart` y `promotions`. La base libSQL de QAL-002 solo se lee; este cambio introduce la
primera escritura y la primera cookie.

## Goals / Non-Goals

**Goals:**
- Un único cálculo de totales, puro y en céntimos, que usan la API, la página y las pruebas.
- Mensajes de rechazo distintos para cada condición de cupón.

**Non-Goals:**
- Reservar stock al añadir: se descuenta al pedir, en QAL-005.
- Varios cupones a la vez.

## Decisions

### 1. Modelo de datos

| Tabla | Columnas |
|---|---|
| `carts` | `id` (UUID), `coupon_code`, `created_at` |
| `cart_items` | `cart_id`, `slug`, `quantity`, PK (`cart_id`, `slug`) |
| `coupons` | `code`, `kind` (`percent`, `fixed`, `shipping`), `value`, `min_subtotal_cents`, `category` (opcional), `valid_until` |

Las tablas se crean en la misma inicialización perezosa de `lib/db/client.ts`. Los cupones son datos de ejemplo
deterministas (`seed-data.ts`). El cupón caducado tiene `valid_until = 2026-09-30`.

### 2. Cookie de carrito

`cart_id` es un UUID aleatorio con `HttpOnly`, `SameSite=Lax` y `Path=/`, y se crea en el primer `POST`. Sin cookie
no hay carrito: `GET` devuelve uno vacío sin crearlo. El carrito no tiene datos personales.

### 3. Cálculo puro (`lib/cart/pricing.ts`)

```
priceCart(lines, coupon | null, now) → { subtotalCents, discountCents, shippingCents, totalCents,
                                         vatIncludedCents, couponStatus: { code, applied, reason? } | null }
```

1. `subtotal = Σ precio × cantidad`.
2. Validación del cupón, en orden (es la tabla de decisión), con el primer motivo que falle:
   1. existe;
   2. vigente (`now <= valid_until`, fin de día);
   3. hay líneas a las que aplicarse (`category`);
   4. se alcanza el mínimo.
3. Descuento:
   - `percent`: `round(base × value / 100)`, donde la base es el subtotal o la suma de las líneas de la categoría;
   - `fixed`: `min(value, subtotal)`;
   - `shipping`: 0 de descuento sobre artículos.
4. `shipping = 0` si el carrito está vacío, si el cupón `shipping` está aplicado o si `subtotal − descuento ≥ 5000`.
   Si no, `495`.
5. `total = subtotal − descuento + envío`; `IVA incluido = total − round(total / 1,21)`.

Al aplicar un cupón (`POST /api/cart/coupon`), si la validación falla se responde 400 y no se guarda. Si un cupón ya
guardado deja de cumplir más tarde (por ejemplo, el carrito baja del mínimo), se conserva, pero `applied: false`
explica el motivo (PROMO-002, último escenario).

### 4. API

| Operación | Respuesta | Errores |
|---|---|---|
| `GET /api/cart` | `Cart` | — |
| `POST /api/cart/items` `{ slug, quantity }` | `Cart` | 400 cantidad · 404 artículo · 409 stock o máximo |
| `PATCH /api/cart/items/{slug}` `{ quantity }` | `Cart` | 400 · 404 línea · 409 |
| `DELETE /api/cart/items/{slug}` | `Cart` | 404 |
| `POST /api/cart/coupon` `{ code }` | `Cart` | 400 con el motivo |
| `DELETE /api/cart/coupon` | `Cart` | — |

`Cart = { items: [{ slug, name, category, priceCents, quantity, maxQuantity, lineTotalCents }], totals, coupon }`.
Todo se registra en el OpenAPI.

### 5. Interfaz

- **Botón "Añadir al carrito"** en la ficha (componente cliente con selector de cantidad). Llama a la API y
  refresca la ruta.
- **Cabecera:** un Server Component lee la cookie y muestra "Carrito (N)".
- **`/carrito`:** líneas con selector de cantidad (1…`maxQuantity`), botón "Eliminar", formulario de cupón y
  resumen de totales con un aviso si el cupón no se aplica.
- **Mensajes de la API** en un `role="status"`.

### 6. Diseño de pruebas (agentes de QAL-003)

| Agente | Trabajo sobre QAL-004 |
|---|---|
| Revisor de specs | `qa/agents/reviews/qal-004.md` |
| Analista | `tests/features/cart/*.feature` (interfaz y API) |
| Diseñador | Tabla de decisión de cupones (`@tabla-decision`), valores límite del envío y del stock (`@valores-limite`), clases de equivalencia de la cantidad (`@clases-equivalencia`) |
| Automatizador | `tests/steps/cart.steps.ts` |

Las pruebas unitarias del cálculo cubren las mismas tablas sin navegador.

## Gherkin

```gherkin
@cart @api @p1 @PROMO-002
Feature: Validación de cupones (tabla de decisión)
  @tabla-decision
  Scenario Outline: Cada condición incumplida tiene su motivo
    Given un carrito con "<contenido>"
    When aplico el cupón "<cupón>"
    Then el cupón se rechaza con "<motivo>"
```

## Risks / Trade-offs

- **[Varias escrituras concurrentes en SQLite]** → libSQL serializa las escrituras. Con 2 workers y operaciones
  cortas no hay contención apreciable.
- **[Cookie de carrito en las pruebas de API]** → cada escenario usa su propio contexto de petición (`request`), con
  sus propias cookies.

## Migration Plan

Las tablas nuevas se crean al arrancar con `CREATE TABLE IF NOT EXISTS`. Las bases existentes (por ejemplo, la de
desarrollo) reciben las tablas y los cupones al iniciar.
