# QAL-005 — Cuenta, checkout con pago simulado y pedidos

**Estado:** aprobado (mandato del fundador del 2026-10-21: ejecutar la hoja de ruta completa) · **Fecha:** 2026-10-21 ·
**Tipo:** producto + calidad + IA

## Why

La tienda permite llenar un carrito, pero no comprar. El flujo de compra es **el recorrido crítico** de cualquier
e-commerce: si falla, no hay negocio. Además trae lo que todavía no se ha podido enseñar:
- **pruebas de seguridad funcional:** sesiones, rutas protegidas y que un cliente no vea los pedidos de otro;
- **pruebas de pago** con casos negativos;
- **consistencia de datos:** stock que baja al comprar;
- un **agente de API** que diseña pruebas a partir del contrato OpenAPI.

## What Changes

- **Cuenta de cliente:**
  - registro, inicio y cierre de sesión;
  - contraseñas con *hash* `scrypt` y sesión en una cookie `HttpOnly`;
  - un cliente de ejemplo ficticio (`cliente@ejemplo.test`).
- **Checkout** (`/checkout`), solo con sesión iniciada:
  - datos de envío validados;
  - **pago simulado** con tarjetas de prueba: aprobada, rechazada, fondos insuficientes, caducada o número no
    válido (Luhn). **Nunca se guarda el número de tarjeta**, solo los cuatro últimos dígitos.
- **Pedidos:**
  - al pagar, en una sola transacción: se vuelve a comprobar el stock, se descuenta, se guarda el pedido con los
    precios y los totales de ese momento, y se vacía el carrito;
  - "Mis pedidos" con listado y detalle.
- **Aislamiento entre clientes:** el pedido de otro cliente responde "no encontrado", no "prohibido", para no revelar
  que existe.
- **API** de cuenta, checkout y pedidos, documentada en el OpenAPI y validada contra su contrato.
- **Agente de API** (`qa-api`): diseña pruebas de contrato y de negocio a partir del OpenAPI. Su primera actuación es
  un **barrido de contrato automático**: recorre cada operación de lectura pública del contrato, la llama y valida la
  respuesta. Es un test que crece solo cuando la API crece.
- **Cierre del hallazgo aplazado del Revisor en QAL-004:** si el stock baja por debajo de lo que hay en un carrito, el
  checkout lo detecta y lo explica.
- **README:** ruta de la visita con la compra completa y las tarjetas de prueba.

## Capabilities

### New Capabilities

- `account`: registro, sesión y rutas protegidas (`ACC-0xx`).
- `checkout`: datos de envío, pago simulado, stock al confirmar y no guardar tarjetas (`CHK-0xx`).
- `orders`: historial, detalle y aislamiento entre clientes (`ORD-0xx`).

### Modified Capabilities

- `qa-agents`: se añade QA-047 (Agente de API y barrido de contrato).

## Valor para la demo

- **Tabla de tarjetas de prueba:** cada tarjeta es un caso negativo distinto con su mensaje. Se enseña cómo se prueba
  un pago sin tocar dinero real.
- **Seguridad funcional:** un cliente intenta abrir el pedido de otro y la tienda responde como si no existiera.
- **Concurrencia de stock:** dos clientes quieren la última unidad y solo uno puede pagarla.
- **El agente de API** amplía la cobertura de contrato sin escribir un test por operación.

## Testing scope

- **Tipologías:**
  - E2E del recorrido completo de compra;
  - API con contrato;
  - seguridad funcional (sesión, autorización, cookies);
  - unitarias (Luhn, reglas de pago, validación de envío, *hash*);
  - barrido de contrato.
- **Riesgo:** alto. Es autenticación y escritura transaccional de stock. Por eso es el cambio con más casos
  negativos.

## Cumplimiento de los requisitos transversales

- **RT-1:** pagos, sesiones, concurrencia y validación de formularios.
- **RT-2:** todo local, sin pasarela real ni servicios externos.
- **RT-3:** nuevos requisitos trazados, y las actuaciones del agente de API, al informe.
- **RT-4:** la ruta de la visita incluye la compra completa.
- **RT-5:** agente de API.

## Fuera de alcance

- Pasarela de pago real, correos de confirmación, recuperación de contraseña y direcciones guardadas.
- Escaneos de seguridad automáticos (QAL-007).

## Riesgos

- **Pruebas en paralelo que compran y bajan stock** → las compras de los escenarios usan artículos con mucho stock
  que no aparecen en aserciones de stock del catálogo. El de "última unidad" usa un artículo dedicado. La base de E2E
  se reinicia en cada ejecución.
- **Datos personales** → todos ficticios (dominio `.test`). No se guardan tarjetas.

## Criterios de éxito

1. Un cliente se registra, añade al carrito, paga con la tarjeta aprobada y ve su pedido en "Mis pedidos". El stock
   baja y el carrito queda vacío.
2. Cada tarjeta de prueba no aprobada se rechaza con su mensaje, y no se crea pedido ni baja el stock.
3. Sin sesión, el checkout y los pedidos redirigen a entrar (interfaz) o responden 401 (API). El pedido de otro
   cliente responde 404.
4. El pedido guarda solo los cuatro últimos dígitos de la tarjeta.
5. El barrido de contrato del agente de API cubre todas las operaciones de lectura públicas del OpenAPI.

## Impact

`lib/account/`, `lib/checkout/`, `lib/orders/`, tablas `users`, `sessions`, `orders` y `order_lines`,
`app/cuenta/`, `app/checkout/`, `app/api/{account,checkout,orders}/`, `.claude/agents/qa-api.md`, README.
