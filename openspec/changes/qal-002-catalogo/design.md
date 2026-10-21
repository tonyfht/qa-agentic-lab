# Design — QAL-002 Catálogo

## Context

QAL-001 dejó una tienda sin datos y un pipeline con trazabilidad. Ver `proposal.md` para el porqué y `specs/catalog`
para los requisitos CAT-001…CAT-009.

## Goals / Non-Goals

**Goals:**
- Una sola función de consulta del catálogo, usada por la página y por la API. Así CAT-009 se cumple por diseño y la
  prueba solo lo confirma.
- Base de datos sin configuración, igual en local y en CI.

**Non-Goals:**
- Escritura de datos (carrito, pedidos): QAL-004 y QAL-005.
- Búsqueda por relevancia avanzada (sinónimos, errores de escritura).

## Decisions

### 1. libSQL con inicialización perezosa

`lib/db/client.ts` abre `DATABASE_URL`, que por defecto es `file:.data/tienda.db` y está ignorado por git. La primera
consulta crea las tablas (`CREATE TABLE IF NOT EXISTS`) y, si `products` está vacía, inserta el catálogo de
`lib/db/seed-data.ts`.

- **Catálogo de ejemplo:** es determinista, con datos escritos a mano. Incluye casos pensados para probar:
  - un artículo a exactamente 19,90 € (CAT-004);
  - dos artículos agotados (CAT-005);
  - uno con 3 unidades (CAT-007);
  - un "algodon" sin tilde (CAT-002).
- **Antes de E2E:** la etapa de construcción borra `.data/e2e.db`, y la tienda de E2E arranca con
  `DATABASE_URL=file:.data/e2e.db`. Cada ejecución empieza desde el mismo estado.

*Alternativa descartada:* migraciones con una herramienta (Drizzle, Prisma). Añaden un paso y una dependencia para dos
tablas. Se reconsiderará cuando haya escritura.

### 2. La consulta, pura y en memoria

`lib/catalog/query.ts` exporta:
- `parseCatalogQuery(params)`: valida con Zod y devuelve los parámetros normalizados o una lista de errores en español;
- `queryCatalog(products, query)`: filtra, ordena y pagina, y devuelve `{ items, total, page, pageCount, pageSize }`.

`normalize(text)` quita tildes (NFD + eliminación de diacríticos) y pasa a minúsculas. Al ser funciones puras, se
prueban con valores límite sin base de datos.

**Relevancia:** coincidencia en el nombre (2 puntos) por delante de coincidencia en la descripción (1 punto), y
desempate alfabético. Sin texto de búsqueda, se ordena por "novedad" y luego por nombre.

### 3. Precios en céntimos

Se guardan como enteros en céntimos y la API los devuelve en céntimos (`priceCents`). La interfaz los formatea con
`Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`. Los filtros de la interfaz admiten euros con
coma o punto ("19,90") y los convierten a céntimos. Así se evitan los errores de redondeo con decimales.

### 4. API

| Operación | Respuesta |
|---|---|
| `GET /api/products` | `ProductList` (`items`, `total`, `page`, `pageCount`, `pageSize`) · 400 `ApiError` |
| `GET /api/products/{slug}` | `Product` · 404 `ApiError` |
| `GET /api/categories` | `Category[]` con `count` |

`ApiError = { error: string, details?: string[] }`. Todos los esquemas se registran en el OpenAPI (QAL-001, D2).

### 5. Interfaz sin JavaScript obligatorio

`/catalogo` es un Server Component que lee `searchParams`. Los filtros son un `<form method="get">`, así que la
página funciona igual sin JavaScript. Es más robusto, más accesible y no tiene sincronización de estado en el cliente
que probar.

Los errores de parámetros se muestran en un `role="alert"` y el catálogo cae a valores por defecto (CAT-009, segundo
escenario).

### 6. Ilustraciones SVG

Un componente `ProductArt` dibuja un SVG con el color y el icono de la categoría y las iniciales del artículo. No hay
ficheros de imagen, derechos ni peticiones externas.

### 7. Pruebas de contrato

`tests/support/contract.ts`:
1. descarga `/api/openapi.json`;
2. compila con Ajv (*draft 2020-12*) el esquema de respuesta de cada operación y código;
3. ofrece `expectContract(operationId, status, body)`.

Los *steps* de API llaman a esa función en cada respuesta: el contrato se comprueba en cada escenario, no en un test
aparte que alguien pueda olvidar.

### 8. Tipo de prueba en el informe

El `@api` de las etiquetas se muestra como "API". Ya existía el mapa de tipos en `report/model.ts`; se amplía.

## Gherkin

`tests/features/catalog/`:

```gherkin
@CAT-004 @api @p1
Scenario Outline: Los límites del rango de precio están incluidos
  When pido por la API los artículos entre <min> y <max> euros
  Then todos cuestan entre <min> y <max> euros
  And la respuesta cumple el contrato publicado
  Examples:
    | min   | max   |
    | 19.90 | 19.90 |
    | 0     | 19.90 |
    | 19.90 | 1000  |
```

El resto de escenarios sigue la spec uno a uno: interfaz (`@e2e`) y API (`@api`).

## Tipologías por requisito

| Requisito | E2E | API | Unitaria | Contrato |
|---|---|---|---|---|
| CAT-001 | ✔ | ✔ | ✔ | |
| CAT-002 | ✔ | ✔ | ✔ | |
| CAT-003 | ✔ | ✔ | ✔ | |
| CAT-004 | ✔ | ✔ (Outline) | ✔ | |
| CAT-005 | ✔ | | ✔ | |
| CAT-006 | | ✔ | ✔ | |
| CAT-007 | ✔ | ✔ | | |
| CAT-008 | | ✔ | | ✔ |
| CAT-009 | ✔ | | ✔ | |

## Risks / Trade-offs

- **[Fichero SQLite bloqueado en Windows si dos procesos lo abren]** → la tienda de E2E usa su propio fichero
  (`e2e.db`), distinto del de desarrollo.
- **[La página dinámica no se puede prerenderizar]** → es correcto: el catálogo depende de la URL.

## Migration Plan

No hay datos previos. La base se crea sola.

## Ajustes durante la implementación

- **Paralelismo fijo de Playwright (2 workers)** en lugar de uno por núcleo. Con 10 navegadores en paralelo en una
  máquina de 20 núcleos, las navegaciones se quedaban sin respuesta; en CI (4 núcleos) habría salido distinto. Un
  valor fijo da el mismo comportamiento en los dos entornos (RT-2).
- **Sin precarga en las tarjetas del catálogo** (`prefetch={false}`): cada página precargaba 24 fichas dinámicas que
  nadie había pedido.
