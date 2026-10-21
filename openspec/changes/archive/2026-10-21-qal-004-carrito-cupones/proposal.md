# QAL-004 — Carrito, stock y cupones

**Estado:** aprobado (mandato del fundador del 2026-10-21: ejecutar la hoja de ruta completa) · **Fecha:** 2026-10-21 ·
**Tipo:** producto + calidad

## Why

El catálogo deja ver artículos, pero no comprarlos. El carrito trae lo que más se presta a enseñar diseño de pruebas
con método (RT-1): reglas de negocio que se combinan.
- límite de stock;
- cupones con mínimo de compra, caducidad y categoría;
- envío gratis a partir de un importe;
- IVA incluido.

Es también el primer cambio que hacen **de punta a punta los agentes de diseño de QAL-003**: revisión de la spec,
escenarios, técnicas y automatización, todo registrado.

## What Changes

- **Carrito por navegador** (cookie de sesión), guardado en la base de datos de la tienda:
  - añadir desde la ficha de producto, con cantidad;
  - cambiar cantidades y eliminar líneas;
  - contador en la cabecera.
- **Límites:** nunca más unidades que el stock disponible, y como máximo 10 por artículo. Un artículo agotado no se
  puede añadir.
- **Cupones** (uno por carrito):
  - `BIENVENIDA10`: 10 % con compra mínima de 30 €;
  - `CASA5`: 5 € de descuento con mínimo de 25 €;
  - `TEXTIL15`: 15 % solo sobre artículos de textil;
  - `ENVIOGRATIS`: envío gratis;
  - `VERANO2026`: caducado, para enseñar el rechazo.
- **Totales:** subtotal, descuento, envío (4,95 €, gratis desde 50 € después del descuento), total e IVA incluido
  (21 %), calculados en céntimos por una función pura.
- **API del carrito** documentada en el OpenAPI y comprobada contra su contrato en cada escenario.
- **Página `/carrito`** con líneas, cantidades, cupón y totales.
- **Trabajo de los agentes de diseño** sobre este cambio, registrado:
  - el Revisor revisa la spec;
  - el Analista escribe los escenarios;
  - el Diseñador aplica tabla de decisión a los cupones y valores límite al envío y al stock;
  - el Automatizador implementa los pasos.

## Capabilities

### New Capabilities

- `cart`: añadir, cambiar, eliminar, límites de stock y totales (IDs `CART-0xx`).
- `promotions`: cupones, envío gratis y sus reglas (IDs `PROMO-0xx`).

### Modified Capabilities

Ninguna.

## Valor para la demo

- **Tabla de decisión en directo:** las cuatro condiciones de un cupón (existe, vigente, mínimo alcanzado, aplicable a
  lo que hay en el carrito) dan una regla por fila. Cada fila es un escenario y cada escenario dice qué mensaje ve el
  cliente.
- **Valores límite del envío gratis:** 49,99 €, 50,00 € y 50,01 €, también después de aplicar un descuento.
- **El informe** muestra las actuaciones de los cuatro agentes sobre este cambio.

## Testing scope

- **Tipologías:** unitarias del cálculo de totales (valores límite y tabla de decisión), API con contrato, E2E del
  flujo de carrito.
- **Riesgo:** medio. Es la primera escritura en base de datos y la primera cookie de sesión.

## Cumplimiento de los requisitos transversales

- **RT-1:** tabla de decisión, valores límite y clases de equivalencia sobre reglas reales.
- **RT-2:** la base de E2E se reinicia en cada ejecución, igual en local y en CI.
- **RT-3:** los tests nuevos llegan trazados, y las actuaciones de los agentes, al informe.
- **RT-4:** la ruta de la visita incluye el carrito y la tabla de decisión.
- **RT-5:** los agentes de diseño trabajan sobre el cambio.

## Fuera de alcance

- Cuenta de usuario, checkout, pago y pedidos (QAL-005). El stock se descuenta al pedir, no al añadir al carrito.
- Carrito compartido entre dispositivos.

## Riesgos

- **Pruebas en paralelo sobre la misma base** → cada escenario tiene su propio carrito (su propia cookie), y el
  carrito no descuenta stock: los escenarios no se pisan.
- **Redondeos** → todo en céntimos, con un único punto de redondeo documentado.

## Criterios de éxito

1. Se puede añadir, cambiar y eliminar en `/carrito`, y la cabecera muestra el número de unidades.
2. No se puede superar el stock ni las 10 unidades, y el mensaje dice cuántas quedan.
3. Los cinco cupones se comportan según la tabla de decisión, y los rechazos explican el motivo.
4. El envío pasa a gratis exactamente en 50,00 € después del descuento.
5. Las respuestas de la API del carrito cumplen el contrato publicado.
6. El registro tiene actuaciones de los cuatro agentes de diseño sobre QAL-004.

## Impact

`lib/cart/`, `lib/db/` (tablas `carts`, `cart_items`, `coupons`), `app/api/cart/`, `app/carrito/`, cabecera, ficha de
producto, `tests/features/cart/`, README.
