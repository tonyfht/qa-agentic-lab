# Design — QAL-005 Cuenta, checkout y pedidos

## Context

Ver `proposal.md` y las specs `account`, `checkout`, `orders` y `qa-agents` (QA-047). El carrito (QAL-004) ya vive
en libSQL con su cookie. Este cambio añade identidad y la primera transacción de escritura que toca stock.

## Goals / Non-Goals

**Goals:**
- Seguridad funcional comprobable: sesiones opacas, contraseñas con *hash*, autorización por propietario y 404
  indistinguible.
- Pago simulado determinista, con una regla por tarjeta.
- Pedido atómico: o se hace todo (stock, pedido, carrito) o nada.

**Non-Goals:** OAuth, recuperación de contraseña, límites de intentos de inicio de sesión (QAL-007 añade cabeceras y
escaneos) y pasarela real.

## Decisions

### 1. Contraseñas y sesiones

- **Contraseñas:** `scrypt` de `node:crypto` con sal aleatoria de 16 bytes, guardada como
  `scrypt$<sal hex>$<hash hex>`. La comprobación usa `timingSafeEqual`. No hace falta ninguna dependencia.
- **Sesiones:** tabla `sessions(id, user_id, expires_at)`. El id son 32 bytes aleatorios en base64url, en la cookie
  `session` (`HttpOnly`, `SameSite=Lax`, `Path=/`, 7 días), y no contiene datos del cliente. Cerrar sesión borra la
  fila y la cookie.
- **Mismo mensaje para cualquier fallo de inicio de sesión** (ACC-002). Si el correo no existe se calcula igualmente
  un *hash* de relleno, para no dar pistas por el tiempo de respuesta.
- **Cliente de ejemplo:** `cliente@ejemplo.test` / `Casa2026`. Se crea al iniciar si no existe. Es ficticio y su
  contraseña es pública a propósito: es una tienda de demostración.

### 2. Volver a donde se iba (ACC-004)

`/cuenta/entrar?next=/checkout`. Solo se admite como `next` una ruta relativa que empiece por `/` y no por `//`.
Cualquier otra cosa lleva a `/cuenta/pedidos`, lo que evita una redirección abierta. Hay pruebas unitarias de ello.

### 3. Pago simulado (`lib/checkout/payment.ts`, puro)

| Entrada | Resultado |
|---|---|
| No pasa Luhn o no tiene 16 dígitos | 400 "El número de tarjeta no es válido" |
| Caducidad `MM/AA` anterior al mes actual | 402 "La tarjeta ha caducado" |
| CVC distinto de 3 dígitos | 400 "El CVC debe tener 3 dígitos" |
| `4000000000000002` | 402 "Tarjeta rechazada por el banco" |
| `4000000000009995` | 402 "Fondos insuficientes" |
| Cualquier otro número válido (incluido `4242…`) | aprobado; se guarda `brand: 'test'` y `last4` |

Los espacios del número se ignoran. Nada de la tarjeta se registra en logs ni en errores.

### 4. Pedido atómico (`lib/orders/place.ts`)

Se usa `db.transaction('write')` de libSQL:
1. cargar el carrito y sus precios actuales;
2. por cada línea, `UPDATE products SET stock = stock − q WHERE slug = ? AND stock >= q`. Si una fila no se
   actualiza, se hace *rollback* y se responde 409 con el artículo y el stock que queda;
3. `INSERT orders` (totales, cupón aplicado, envío, `last4`) y sus `order_lines` (precio unitario de ese momento);
4. vaciar `cart_items` y quitar el cupón del carrito;
5. `commit`.

El número de pedido es `TC-` seguido del id autoincremental con 6 cifras.

**Orden de comprobaciones:** sesión (401) → carrito no vacío (400) → datos de envío (400 con `fields`) → tarjeta
(400 o 402) → stock (409, dentro de la transacción).

### 5. API

| Operación | Respuesta | Errores |
|---|---|---|
| `POST /api/account/register` | 201 `Account` | 400 (`fields`) · 409 correo existente |
| `POST /api/account/login` | 200 `Account` | 400 · 401 |
| `POST /api/account/logout` | 200 `{ status: 'ok' }` | — |
| `GET /api/account/me` | 200 `Account` | 401 |
| `POST /api/checkout` | 201 `Order` | 400 · 401 · 402 · 409 |
| `GET /api/orders` | 200 `OrderSummary[]` | 401 |
| `GET /api/orders/{number}` | 200 `Order` | 401 · 404 |

`ApiError` gana `fields?: Record<string, string>` para los errores por campo. Es un campo opcional, así que es
compatible con lo anterior.

### 6. Interfaz

- **Cuenta:** `/cuenta/entrar`, `/cuenta/registro`, `/cuenta/pedidos` y `/cuenta/pedidos/[numero]` (con `?nuevo=1`
  muestra "Gracias por tu pedido").
- **Checkout (`/checkout`):** Server Component que redirige si no hay sesión, con un formulario cliente que llama a
  la API.
- **Cabecera:** "Entrar", o "Hola, {nombre}", "Mis pedidos" y "Salir".

### 7. Agente de API y barrido (QA-047)

- **`qa-api.md`:** lee `/api/openapi.json` y diseña, por operación, los casos de contrato (cada código de respuesta
  documentado) y de negocio (reglas de la spec). Entrega Gherkin `@api` con la comprobación de contrato en cada paso.
- **Barrido de contrato** (`tests/features/api/barrido-contrato.feature`): un escenario que recorre el contrato,
  elige las operaciones `GET` sin parámetros obligatorios y sin respuesta 401, las llama y valida cada una. La función
  que elige las operaciones es pura y tiene pruebas unitarias.

### 8. Pruebas en paralelo sin interferencias

Cada escenario que compra usa un artículo exclusivo con mucho stock:

| Escenario | Artículo |
|---|---|
| Compra completa por la API | velas |
| Compra por la interfaz | marco de fotos |
| Historial | guirnalda |
| Aislamiento | toallas |
| Tarjetas rechazadas | cojín (no cambian el stock) |
| "Última unidad" | lámpara de pie, la única con stock 2 |

Las aserciones de stock se calculan respecto al valor leído antes, no con números fijos. Los correos son únicos
por escenario.

## Gherkin

```gherkin
@checkout @api @p1 @CHK-002 @clases-equivalencia
Scenario Outline: Cada tarjeta de prueba tiene su resultado
  Given un cliente con sesión y "cojin-lino-natural x1" en el carrito
  When paga por la API con la tarjeta "<tarjeta>" y caducidad "<caducidad>"
  Then la API responde <estado>
  And el error explica "<mensaje>"
  And el stock de "cojin-lino-natural" no ha cambiado
```

## Risks / Trade-offs

- **[Transacciones libSQL en fichero con escrituras concurrentes]** → con `transaction('write')` se serializan. Un
  pago espera a otro; no hay riesgo de descuento doble.
- **[El hash de contraseña ralentiza las pruebas]** → los parámetros por defecto de `scrypt` tardan unos ms por
  operación. Es asumible.

## Migration Plan

Las tablas nuevas se crean con `CREATE TABLE IF NOT EXISTS`. El cliente de ejemplo se inserta si no existe.
