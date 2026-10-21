# Spec Delta — storefront

## Purpose

Define el escaparate de La Tienda en Casa: lo que hace que parezca y se use como una tienda online (cabecera,
portada, pie, fotos de producto y sus créditos). Las reglas de negocio siguen en `catalog`, `cart`, `promotions` y
`checkout`.

## ADDED Requirements

### Requirement: SHOP-001 Cabecera de tienda
Todas las páginas de la tienda SHALL mostrar una cabecera con:
- la franja de ventajas (envío gratis desde 50 € y pago simulado);
- un buscador que lleva al catálogo con el texto buscado;
- un menú con las cinco categorías;
- el acceso a la cuenta;
- el carrito con el número de unidades.

El enlace del carrito SHALL tener como texto accesible "Carrito (N)".

#### Scenario: Buscar desde cualquier página
- **GIVEN** que estoy en la ficha de un artículo
- **WHEN** busco "lino" en el buscador de la cabecera
- **THEN** llego al catálogo con los artículos que contienen "lino"

#### Scenario: Categoría desde el menú
- **WHEN** elijo "Iluminación" en el menú de categorías
- **THEN** el catálogo muestra solo artículos de iluminación

### Requirement: SHOP-002 Portada que invita a comprar
La portada SHALL mostrar:
- un banner de temporada con un enlace al catálogo;
- un acceso por cada categoría;
- una sección "Mejor valorados" con los 4 artículos con stock de mayor valoración;
- una sección "Novedades";
- las garantías de la tienda (envío, devoluciones y pago).

#### Scenario: Secciones de la portada
- **WHEN** abro la portada
- **THEN** veo el banner, las cinco categorías, "Mejor valorados" con 4 artículos y "Novedades"

#### Scenario: Mejor valorados sin agotados
- **GIVEN** un artículo agotado con la valoración más alta
- **WHEN** abro la portada
- **THEN** ese artículo no aparece en "Mejor valorados"

### Requirement: SHOP-003 Fotos de producto con crédito
Cada artículo, categoría y banner SHALL tener una foto servida por la propia tienda, con un texto alternativo que la describe. Cada foto SHALL figurar en `public/images/creditos.json` con autor, enlace a la fuente y licencia. La página de créditos SHALL listarlas todas.

#### Scenario: Ficha con foto
- **WHEN** abro la ficha del "Mantel antimanchas"
- **THEN** veo su foto con un texto alternativo no vacío, servida desde la propia tienda

#### Scenario: Foto sin crédito
- **GIVEN** una foto en `public/images/` que no figura en `creditos.json`
- **WHEN** se ejecutan las pruebas
- **THEN** la prueba de créditos falla nombrando la foto

### Requirement: SHOP-004 Pie de tienda
Todas las páginas SHALL tener un pie con:
- columnas de tienda (categorías), ayuda (envíos, devoluciones y pago simulado) y laboratorio (informe de calidad y
  repositorio);
- los enlaces a privacidad y a los créditos de las fotos.

#### Scenario: Enlaces del pie
- **WHEN** abro cualquier página
- **THEN** el pie enlaza a "Privacidad y cookies", "Créditos de las fotos" y "Informe de calidad"

#### Scenario: Créditos desde el pie
- **WHEN** sigo "Créditos de las fotos"
- **THEN** veo una tabla con cada foto, su autor y su licencia
