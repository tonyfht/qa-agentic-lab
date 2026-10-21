# Tasks — QAL-010 La Tienda en Casa, de maqueta a tienda

Rama: `change/qal-010-tienda-retail`.

## 1. Base

- [x] 1.1 Fotos de Unsplash elegidas, descargadas una vez y optimizadas a WebP en `public/images/`, con
  `creditos.json`. Se verifica con la prueba unitaria de créditos (SHOP-003).
- [x] 1.2 Tokens, tipografía con `next/font` e iconos propios. Se verifica con los escenarios de accesibilidad (axe) y
  con "el navegador no habla con terceros" (CMP-003).
- [x] 1.3 Funciones puras: `topRated`, `relatedProducts`, `activeFilterChips`, `freeShippingProgress`, y rutas y
  textos alternativos de imágenes. Se verifica con pruebas unitarias.

## 2. Escaparate

- [x] 2.1 Cabecera con franja de ventajas, buscador, categorías, cuenta y carrito. Se verifica con los escenarios de
  SHOP-001 y con los existentes de cabecera y cuenta.
- [x] 2.2 Portada y pie, más la página `/creditos`. Se verifica con los escenarios de SHOP-002 y SHOP-004.

## 3. Catálogo y ficha

- [x] 3.1 Tarjeta con foto, valoración, insignias y "Añadir {nombre} al carrito". Se verifica con los escenarios de
  CART-006.
- [x] 3.2 Filtros inmediatos, chips y cajón en el móvil. Se verifica con los escenarios de CAT-010 y CAT-011 y con
  los de filtros existentes.
- [x] 3.3 Ficha con foto, envío y devolución, y relacionados. Se verifica con el escenario de CAT-012 y los de ficha
  existentes.

## 4. Carrito, pago y cuenta

- [x] 4.1 Carrito con fotos, barra de envío gratis y carrito vacío con sugerencias. Se verifica con los escenarios de
  PROMO-005 y CART-007 y los de carrito existentes.
- [x] 4.2 Pasos de la compra y pago restyled. Se verifica con el escenario de CHK-006 y los de compra existentes.
- [x] 4.3 Cuenta, pedidos y privacidad con la nueva identidad. Se verifica con los escenarios de cuenta y pedidos
  existentes.

## 5. Calidad

- [x] 5.1 Suite completa en verde sin cambiar aserciones, y Lighthouse dentro de presupuesto (EXP-006). Se verifica
  con `npm run qa`.
- [x] 5.2 Referencias visuales regeneradas en Linux y revisadas. Se verifica con el workflow *Referencias visuales*
  y con el PR.
- [x] 5.3 Auditoría de experiencia antes y después. Se verifica con la revisión del Auditor de experiencia y su
  registro.

## 6. Guía

- [x] 6.1 README (ruta y requisitos previos), AGENTS.md (dominio `SHOP`) y capturas. Se verifica con los
  comprobadores de enlaces.

## Testing

| Requisito | Prueba |
|---|---|
| SHOP-001…004 | `tests/features/storefront/escaparate.feature`, `tests/unit/lib/images.test.ts` |
| CAT-010…012 | `tests/features/catalog/escaparate-catalogo.feature`, `tests/unit/lib/merchandising.test.ts` |
| CART-006, 007 | `tests/features/cart/carrito-escaparate.feature`, `tests/unit/lib/merchandising.test.ts` |
| PROMO-005 | `tests/features/cart/carrito-escaparate.feature`, `tests/unit/lib/progress.test.ts` |
| CHK-006 | `tests/features/checkout/pasos.feature` |
| EXP-006 | Lighthouse en la etapa de rendimiento |

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-010-tienda-retail`.
