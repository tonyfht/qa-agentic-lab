# Tasks — QAL-004 Carrito, stock y cupones

Rama: `change/qal-004-carrito-cupones`.

## 1. Revisión de la spec (agente Revisor)

- [x] 1.1 Revisión de las specs `cart` y `promotions` en `qa/agents/reviews/qal-004.md`, registrada, y ajustes de la
  spec que se acepten. Se verifica con el registro válido y `openspec validate` en verde.

## 2. Datos y cálculo

- [x] 2.1 Tablas `carts`, `cart_items` y `coupons`, con los cupones de ejemplo. Se verifica con pruebas unitarias de
  los datos.
- [x] 2.2 `lib/cart/pricing.ts` puro: totales, validación de cupones en orden, envío e IVA. Se verifica con pruebas
  unitarias trazadas a CART-005 y PROMO-001…004, con los importes de la spec.
- [x] 2.3 `lib/cart/repository.ts`: crear carrito, añadir (sumando), cambiar, eliminar y cupón, con límites de stock y
  máximo. Se verifica con los escenarios de API.

## 3. API e interfaz

- [x] 3.1 Rutas `/api/cart`, `/api/cart/items`, `/api/cart/items/{slug}` y `/api/cart/coupon`, registradas en el
  OpenAPI. Se verifica con la prueba unitaria del OpenAPI y los escenarios `@api`.
- [x] 3.2 Botón "Añadir al carrito" en la ficha, contador en la cabecera y página `/carrito`. Se verifica con los
  escenarios `@e2e`.

## 4. Escenarios (agentes Analista, Diseñador y Automatizador)

- [x] 4.1 `.feature` de carrito y cupones con tabla de decisión, valores límite y clases de equivalencia, registrados.
  Se verifica con la comprobación de etiquetado en verde.
- [x] 4.2 `tests/steps/cart.steps.ts`, registrado. Se verifica con `npm run qa -- --stage e2e` en verde.

## 5. Guía

- [x] 5.1 README: paso de la ruta con el carrito y la tabla de decisión, y tabla "Quiero...". Se verifica con los
  comprobadores de enlaces en verde.

## 6. Verificación

- [ ] 6.1 Pipeline en verde en local y en el PR. Se verifica con la ejecución del PR.

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-004-carrito-cupones`.
