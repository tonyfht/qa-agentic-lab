# Spec Delta — catalog

## ADDED Requirements

### Requirement: CAT-010 Filtros inmediatos y chips
En el catálogo, cambiar la categoría, el orden o "Solo con stock" SHALL aplicar el filtro sin pulsar ningún botón. La búsqueda y el rango de precio SHALL aplicarse con "Aplicar", que también sirve sin JavaScript. Cada filtro activo SHALL mostrarse como un chip que lo quita al pulsarlo, conservando los demás.

#### Scenario: Filtro inmediato
- **WHEN** elijo la categoría "Textil" en el catálogo
- **THEN** la lista se actualiza a artículos de textil sin pulsar "Aplicar"

#### Scenario: Quitar un filtro con su chip
- **GIVEN** el catálogo filtrado por "Textil" y con "Solo con stock"
- **WHEN** pulso el chip "Textil"
- **THEN** desaparece el filtro de categoría y se mantiene "Solo con stock"

### Requirement: CAT-011 Filtros en un cajón en el móvil
En pantallas estrechas, los filtros SHALL estar en un cajón que se abre con el botón "Filtros" y se cierra con "Cerrar" o con Escape, de modo que los artículos sean lo primero que se ve. Al abrirse, el foco SHALL pasar al cajón.

#### Scenario: Catálogo en el móvil
- **GIVEN** una pantalla de 390 px de ancho
- **WHEN** abro el catálogo
- **THEN** el primer artículo se ve sin desplazarse y los filtros están ocultos tras el botón "Filtros"

#### Scenario: Abrir y cerrar el cajón con el teclado
- **GIVEN** una pantalla de 390 px de ancho
- **WHEN** abro los filtros y pulso Escape
- **THEN** el cajón se cierra y el foco vuelve al botón "Filtros"

### Requirement: CAT-012 Artículos relacionados
La ficha de un artículo SHALL mostrar hasta 4 artículos relacionados de la misma categoría, sin incluir el propio artículo, primero los que tienen stock y, entre ellos, los de mayor valoración.

#### Scenario: Relacionados de la misma categoría
- **WHEN** abro la ficha del "Mantel antimanchas"
- **THEN** veo hasta 4 artículos de textil, ninguno de ellos el mantel

#### Scenario: Agotados al final
- **GIVEN** una categoría con un artículo agotado
- **WHEN** se calculan los relacionados
- **THEN** el agotado va detrás de todos los que tienen stock
