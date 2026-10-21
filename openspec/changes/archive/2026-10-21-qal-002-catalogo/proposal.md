# QAL-002 — Catálogo de La Tienda en Casa

**Estado:** aprobado (mandato del fundador del 2026-10-21: ejecutar la hoja de ruta completa) · **Fecha:** 2026-10-21 ·
**Tipo:** producto + calidad

## Why

La tienda solo tiene portada. Sin catálogo no hay nada que probar, y el laboratorio no puede enseñar todavía su idea
central: **un mismo requisito probado a la vez por la interfaz, por la API y con pruebas unitarias**, todo trazado
desde la especificación. El catálogo es el primer ciclo SDD completo de producto y la base de los cambios siguientes
(carrito, checkout).

## What Changes

- **Datos de la tienda:** base de datos SQLite (libSQL, decisión D3 de QAL-001) con un catálogo de ejemplo
  determinista de 24 artículos para el hogar en 5 categorías. Se crea y se rellena sola al primer uso: no hay que
  configurar nada.
- **Catálogo en la interfaz** (`/catalogo`):
  - listado paginado;
  - búsqueda por texto, sin distinguir mayúsculas ni tildes;
  - filtros por categoría, rango de precio y "solo con stock";
  - ordenación.

  Funciona también sin JavaScript (formulario `GET`).
- **Ficha de producto** (`/producto/<slug>`): precio, stock, valoración y descripción, con su página "no encontrado".
- **API del catálogo**, documentada en el OpenAPI generado desde Zod:
  - `GET /api/products`, con los mismos filtros que la interfaz y error 400 explicado si los parámetros son inválidos;
  - `GET /api/products/{slug}`;
  - `GET /api/categories`.
- **Ilustraciones de producto** generadas como SVG a partir de la categoría: libres de derechos y sin ficheros de imagen.
- **Pruebas:**
  - escenarios Gherkin de interfaz (`@e2e`) y de API (`@api`) para cada requisito;
  - un `Scenario Outline` con valores límite de precio;
  - pruebas unitarias de la lógica de búsqueda y filtrado;
  - **prueba de contrato**: cada respuesta real de la API se valida contra el OpenAPI publicado.
- **Informe:** la trazabilidad distingue el tipo de prueba (E2E, API, unitaria) de cada requisito.
- **README:** pasos nuevos en la ruta de la visita (catálogo, API, `.feature` del catálogo).

## Capabilities

### New Capabilities

- `catalog`: listado, búsqueda, filtros, ordenación, ficha de producto y API del catálogo (IDs `CAT-0xx`).

### Modified Capabilities

Ninguna. Los cambios en el informe (tipo de prueba en la trazabilidad) son de presentación y no alteran requisitos de
`quality-report`.

## Valor para la demo

El cliente ve **el mismo requisito (por ejemplo, `CAT-004` filtro por precio) cubierto por tres tipos de prueba**:
- un escenario de interfaz;
- uno de API;
- las pruebas unitarias de valores límite.

Ve también el **contrato de la API** comprobado en cada ejecución. En el informe, la fila de `CAT-004` muestra
"E2E 1 · API 3 · unitaria 4".

## Testing scope

- **Tipologías:** E2E (interfaz), API, contrato (OpenAPI), unitarias con valores límite y clases de equivalencia.
- **Riesgo:** medio. Es la primera base de datos del proyecto. Si se diseña mal, el carrito y los pedidos la heredarían.

## Cumplimiento de los requisitos transversales

- **RT-1:** la búsqueda y los filtros dan clases de equivalencia, valores límite y combinaciones *pairwise*.
- **RT-2:** la base de datos es un fichero local, la misma en desarrollo, en local y en CI, sin servicios externos.
- **RT-3:** los nuevos tests llegan trazados al informe.
- **RT-4:** la ruta de la visita crece con el catálogo y la API.
- **RT-5:** los agentes llegan en QAL-003. Este cambio prepara el terreno que diseñarán.

## Fuera de alcance

- Carrito, stock reservado y cupones (QAL-004).
- **Despliegue público en Vercel (D6).** Necesita la cuenta del fundador y lo conecta él. La tienda se puede ver en
  local y las pruebas corren en CI.
- Imágenes fotográficas de producto.

## Riesgos

- **Base de datos en un despliegue sin disco persistente** → el catálogo es de solo lectura y se regenera al arrancar.
  Los datos que se escriban (QAL-004 y siguientes) tendrán que considerarlo.
- **Búsqueda en memoria** → con 24 artículos es la opción más simple y fácil de probar. Si el catálogo creciera,
  pasaría a SQL sin cambiar el contrato.

## Criterios de éxito

1. `/catalogo` muestra 12 artículos por página y permite buscar, filtrar por categoría, precio y stock, y ordenar, con y
   sin JavaScript.
2. `GET /api/products` devuelve los mismos resultados que la interfaz para los mismos parámetros, y 400 con el motivo
   si los parámetros son inválidos.
3. Las respuestas de la API validan contra `/api/openapi.json` en cada ejecución del pipeline.
4. Cada requisito `CAT-0xx` tiene al menos una prueba, y el informe muestra su tipo.
5. El pipeline queda en verde en local y en CI, y la ruta de la visita incluye el catálogo.

## Impact

Dependencias nuevas: `@libsql/client` y Ajv (validación de contrato en pruebas). Ficheros nuevos en `lib/catalog/`,
`lib/db/`, `app/catalogo/`, `app/producto/`, `app/api/products/` y `tests/features/catalog/`.
