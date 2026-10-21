# Tasks — QAL-005 Cuenta, checkout y pedidos

Rama: `change/qal-005-checkout-pedidos`.

## 1. Revisión de la spec (agente Revisor)

- [x] 1.1 Revisión de `account`, `checkout` y `orders` en `qa/agents/reviews/qal-005.md`, registrada, y ajustes
  aceptados. Se verifica con el registro válido y `openspec validate` en verde.

## 2. Cuenta

- [x] 2.1 `lib/account/password.ts` (scrypt), validación de registro y de `next`. Se verifica con pruebas unitarias
  (ACC-001, ACC-003, ACC-004).
- [x] 2.2 Tablas `users` y `sessions`, cliente de ejemplo, repositorio y cookie de sesión. Se verifica con los
  escenarios de cuenta.
- [x] 2.3 API de cuenta y páginas de entrar, registro y cabecera. Se verifica con los escenarios `@api` y `@e2e` de
  cuenta.

## 3. Checkout y pedidos

- [x] 3.1 `lib/checkout/payment.ts` y validación de envío, puros. Se verifica con pruebas unitarias de cada tarjeta y
  campo (CHK-001, CHK-002, CHK-005).
- [x] 3.2 Pedido atómico (`lib/orders/place.ts`) con comprobación de stock y tablas `orders` y `order_lines`. Se
  verifica con los escenarios de compra y de última unidad (CHK-003, CHK-004).
- [x] 3.3 API de checkout y pedidos registrada en el OpenAPI, con `ApiError.fields`. Se verifica con la prueba unitaria
  del OpenAPI y los escenarios `@api`.
- [x] 3.4 Páginas `/checkout` y `/cuenta/pedidos[/numero]`. Se verifica con los escenarios `@e2e`.

## 4. Agente de API y escenarios

- [x] 4.1 `.claude/agents/qa-api.md` y su alta en el registro de agentes. Se verifica con la comprobación de
  definición de agentes.
- [x] 4.2 Barrido de contrato con su función de selección probada. Se verifica con el escenario de barrido y las
  pruebas unitarias (QA-047).
- [x] 4.3 Features de cuenta, checkout y pedidos (Analista, Diseñador y Agente de API) y *steps* (Automatizador),
  registrados. Se verifica con `npm run qa -- --stage e2e` en verde.

## 5. Guía

- [x] 5.1 README: paso de la ruta con la compra completa y las tarjetas de prueba. AGENTS.md: Agente de API. Se
  verifica con los comprobadores de enlaces en verde.

## 6. Verificación

- [ ] 6.1 Pipeline en verde en local y en el PR. Se verifica con la ejecución del PR.

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-005-checkout-pedidos`.
