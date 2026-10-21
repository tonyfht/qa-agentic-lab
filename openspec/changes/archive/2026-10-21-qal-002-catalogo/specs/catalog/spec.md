# Spec Delta — catalog

## Purpose

Define cómo una persona encuentra artículos en La Tienda en Casa: listado, búsqueda, filtros, ordenación, ficha de
producto y la API pública que ofrece lo mismo a otros sistemas.

## ADDED Requirements

### Requirement: CAT-001 Listado del catálogo
La tienda SHALL mostrar el catálogo en páginas de 12 artículos como máximo, cada uno con nombre, categoría, precio en euros y disponibilidad, e indicar el total de resultados y la página actual.

#### Scenario: Primera página del catálogo
- **GIVEN** el catálogo de ejemplo con 24 artículos
- **WHEN** una persona abre el catálogo sin filtros
- **THEN** ve 12 artículos y el texto "24 artículos"
- **AND** puede ir a la página 2, que muestra los 12 restantes

#### Scenario: Página fuera de rango
- **WHEN** se pide una página mayor que la última
- **THEN** se muestra un catálogo vacío con un enlace para volver a la primera página, sin error

### Requirement: CAT-002 Búsqueda por texto
La búsqueda SHALL encontrar los artículos cuyo nombre o descripción contengan el texto buscado, sin distinguir mayúsculas, minúsculas ni tildes. Un texto que solo contiene espacios SHALL tratarse como búsqueda vacía.

#### Scenario: Búsqueda sin tildes
- **WHEN** se busca "cafetera" o "CAFETERA"
- **THEN** aparece la "Cafetera italiana de aluminio"

#### Scenario: Búsqueda con tilde que el artículo no lleva
- **WHEN** se busca "algodón" y el artículo se describe como "algodon"
- **THEN** el artículo aparece igualmente

#### Scenario: Sin resultados
- **WHEN** se busca un texto que no aparece en ningún artículo
- **THEN** se muestra "No hemos encontrado artículos" con una sugerencia para quitar filtros

### Requirement: CAT-003 Filtro por categoría
El catálogo SHALL poder filtrarse por una de las categorías existentes, mostrando cuántos artículos tiene cada una. Una categoría inexistente SHALL rechazarse.

#### Scenario: Filtrar por categoría
- **WHEN** se filtra por la categoría "Textil"
- **THEN** solo aparecen artículos de textil y el total coincide con el contador de la categoría

#### Scenario: Categoría inexistente
- **WHEN** se pide por la API la categoría "jardineria-espacial"
- **THEN** la API responde 400 indicando que la categoría no existe

### Requirement: CAT-004 Filtro por rango de precio
El catálogo SHALL poder filtrarse por precio mínimo y máximo en euros, ambos incluidos. Un mínimo mayor que el máximo o un precio negativo SHALL rechazarse con un mensaje que lo explique.

#### Scenario: Límites incluidos
- **GIVEN** un artículo que cuesta exactamente 19,90 €
- **WHEN** se filtra con mínimo 19,90 y máximo 19,90
- **THEN** el artículo aparece

#### Scenario: Rango invertido
- **WHEN** se filtra con mínimo 50 y máximo 10
- **THEN** la API responde 400 con el motivo "el precio mínimo no puede ser mayor que el máximo"
- **AND** la interfaz muestra el aviso sin perder el resto de filtros

### Requirement: CAT-005 Filtro de disponibilidad
El catálogo SHALL permitir mostrar solo los artículos con stock. Un artículo sin stock SHALL seguir apareciendo sin el filtro, marcado como "Agotado".

#### Scenario: Solo con stock
- **WHEN** se activa "solo con stock"
- **THEN** ningún artículo mostrado está agotado

#### Scenario: Artículo agotado sin filtro
- **WHEN** se abre el catálogo sin filtros
- **THEN** los artículos sin stock aparecen marcados como "Agotado"

### Requirement: CAT-006 Ordenación
El catálogo SHALL poder ordenarse por relevancia (orden por defecto), precio ascendente, precio descendente, nombre y valoración. Un criterio de ordenación desconocido SHALL rechazarse.

#### Scenario: Precio ascendente
- **WHEN** se ordena por precio ascendente
- **THEN** cada artículo cuesta lo mismo o más que el anterior

#### Scenario: Criterio desconocido
- **WHEN** se pide por la API el orden "aleatorio"
- **THEN** la API responde 400 indicando los criterios admitidos

### Requirement: CAT-007 Ficha de producto
Cada artículo SHALL tener una ficha con nombre, categoría, precio, valoración, disponibilidad ("Quedan N" si quedan 5 o menos, "Agotado" si no queda ninguno) y descripción. Un artículo inexistente SHALL mostrar una página "no encontrado" y la API SHALL responder 404.

#### Scenario: Ficha con pocas unidades
- **GIVEN** un artículo con 3 unidades
- **WHEN** se abre su ficha
- **THEN** se ve "Quedan 3"

#### Scenario: Artículo inexistente
- **WHEN** se abre la ficha de un artículo que no existe
- **THEN** se muestra "Este artículo no existe" con un enlace al catálogo
- **AND** la API responde 404 para ese mismo artículo

### Requirement: CAT-008 API del catálogo con contrato publicado
La API del catálogo SHALL estar descrita en el documento OpenAPI de la tienda, y cada respuesta SHALL cumplir el esquema publicado, también las de error.

#### Scenario: Respuestas que cumplen el contrato
- **WHEN** se llama a `GET /api/products`, `GET /api/products/{slug}` y `GET /api/categories`
- **THEN** cada respuesta valida contra el esquema de esa operación en `/api/openapi.json`

#### Scenario: Error que cumple el contrato
- **WHEN** se llama a `GET /api/products` con parámetros inválidos
- **THEN** la respuesta 400 valida contra el esquema de error publicado

### Requirement: CAT-009 Misma respuesta en interfaz y API
Para los mismos parámetros de búsqueda, filtro y orden, la interfaz y la API SHALL mostrar los mismos artículos en el mismo orden.

#### Scenario: Interfaz y API coinciden
- **WHEN** se busca "taza", se filtra por "Cocina" y se ordena por precio descendente
- **THEN** la lista de la interfaz y la de la API tienen los mismos artículos en el mismo orden

#### Scenario: Parámetros inválidos en la interfaz
- **WHEN** la interfaz recibe un orden desconocido en la URL
- **THEN** muestra el aviso y el catálogo con el orden por defecto, sin error de página
