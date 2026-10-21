# Spec Delta — cart

## ADDED Requirements

### Requirement: CART-006 Añadir desde la tarjeta
Cada tarjeta de artículo con stock SHALL tener un botón "Añadir {nombre} al carrito" que añade una unidad sin salir de la página y actualiza el contador de la cabecera. Un artículo agotado SHALL mostrar "Agotado" en lugar del botón.

#### Scenario: Añadir desde el catálogo
- **WHEN** pulso "Añadir Taza de desayuno XL al carrito" en el catálogo
- **THEN** sigo en el catálogo, veo el aviso "Añadido al carrito" y la cabecera muestra "Carrito (1)"

#### Scenario: Artículo agotado
- **GIVEN** un artículo sin stock
- **WHEN** veo su tarjeta
- **THEN** no tiene botón de añadir y muestra "Agotado"

### Requirement: CART-007 Carrito vacío con sugerencias
El carrito vacío SHALL explicarlo, enlazar al catálogo y sugerir 4 artículos con stock, los de mayor valoración.

#### Scenario: Carrito vacío
- **GIVEN** un carrito sin artículos
- **WHEN** abro el carrito
- **THEN** veo "Tu carrito está vacío", un enlace al catálogo y 4 sugerencias que se pueden añadir

#### Scenario: Añadir una sugerencia
- **GIVEN** el carrito vacío con sugerencias
- **WHEN** añado una sugerencia
- **THEN** el carrito muestra ese artículo con 1 unidad
