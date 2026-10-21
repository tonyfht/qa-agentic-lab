# Tasks — QAL-002 Catálogo

Rama: `change/qal-002-catalogo`.

## 1. Datos

- [x] 1.1 `lib/db/client.ts` con inicialización perezosa y `lib/db/seed-data.ts` con 24 artículos en 5 categorías
  (incluye los casos de prueba del diseño). Se verifica con pruebas unitarias del catálogo de ejemplo: 24 artículos,
  slugs únicos, un artículo a 19,90 €, dos agotados y uno con 3 unidades.
- [x] 1.2 `.data/` en `.gitignore` y `DATABASE_URL` por entorno. Se verifica con `npm run dev`, que crea la base
  sola.

## 2. Consulta del catálogo

- [x] 2.1 `lib/catalog/query.ts` (`parseCatalogQuery`, `queryCatalog`, `normalize`). Se verifica con pruebas unitarias
  trazadas a CAT-001…CAT-006 y CAT-009, con valores límite, rango invertido, negativos, tildes y paginación fuera de
  rango.

## 3. API

- [x] 3.1 Esquemas Zod (`Product`, `ProductList`, `Category`, `ApiError`) registrados en el OpenAPI. Se verifica con la
  prueba unitaria del documento OpenAPI ampliada.
- [x] 3.2 Rutas `GET /api/products`, `GET /api/products/{slug}` y `GET /api/categories`. Se verifica con los
  escenarios `@api`.

## 4. Interfaz

- [x] 4.1 Cabecera común con navegación, `ProductArt` y formato de precios. Se verifica con lint, tipos y E2E.
- [x] 4.2 `/catalogo` con formulario `GET`, avisos de error, estado vacío y paginación. Se verifica con los escenarios
  `@e2e` del catálogo.
- [x] 4.3 `/producto/[slug]` y su página "no encontrado". Se verifica con los escenarios de CAT-007.
- [x] 4.4 La portada enlaza al catálogo y muestra novedades. Se verifica con el escenario de humo existente, que sigue
  en verde.

## 5. Pruebas y pipeline

- [x] 5.1 `tests/support/contract.ts` con Ajv y *steps* de API que comprueban el contrato en cada respuesta. Se verifica
  con un escenario de contrato que falla si el esquema no coincide (comprobado con una prueba unitaria del ayudante).
- [x] 5.2 Features `tests/features/catalog/*.feature` según el `design.md`. Se verifica con `npm run qa -- --stage e2e`
  en verde.
- [x] 5.3 La etapa `build` borra `.data/e2e.db` y la tienda de E2E usa ese fichero. Se verifica con dos ejecuciones
  seguidas con el mismo resultado.
- [x] 5.4 El informe muestra el tipo "API". Se verifica con una prueba unitaria de `testKind`.

## 6. Guía

- [x] 6.1 README: pasos de la ruta para el catálogo, la API y sus `.feature`, y la tabla "Quiero...". Se verifica con
  el comprobador de enlaces en verde.

## 7. Verificación

- [x] 7.1 `npm run qa` en verde en local, y el PR en verde en CI con la trazabilidad de CAT-001…CAT-009 en el informe.
  Se verifica con la ejecución del PR.

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-002-catalogo`.
