# Spec Delta — cart

## Purpose

Define el carrito de La Tienda en Casa: cómo se añaden, cambian y eliminan artículos, qué límites de stock se
respetan y cómo se calculan los totales que ve el cliente antes de pagar.

## ADDED Requirements

### Requirement: CART-001 Añadir al carrito
El cliente SHALL poder añadir un artículo con stock al carrito desde su ficha, eligiendo la cantidad. Si el artículo ya estaba en el carrito, SHALL sumarse a la cantidad existente. La cabecera SHALL mostrar el número total de unidades del carrito.

#### Scenario: Primer artículo
- **GIVEN** un carrito vacío
- **WHEN** el cliente añade 2 unidades de "Manta de punto gruesa"
- **THEN** el carrito tiene una línea con 2 unidades y la cabecera muestra "Carrito (2)"

#### Scenario: Artículo que ya estaba
- **GIVEN** un carrito con 1 unidad de un artículo
- **WHEN** el cliente añade 2 unidades más del mismo artículo
- **THEN** la línea pasa a 3 unidades, sin duplicarse

#### Scenario: Artículo agotado
- **WHEN** el cliente intenta añadir un artículo sin stock
- **THEN** no se añade y se le informa de que el artículo está agotado

### Requirement: CART-002 Límite de unidades
Una línea del carrito SHALL tener como mínimo 1 unidad y como máximo el menor de dos valores: el stock disponible y 10 unidades. Una petición que supere el límite SHALL rechazarse indicando cuántas unidades se pueden tener como máximo.

#### Scenario: Justo en el stock disponible
- **GIVEN** un artículo con 3 unidades en stock
- **WHEN** el cliente pide 3 unidades
- **THEN** se añaden las 3

#### Scenario: Una más que el stock
- **GIVEN** un artículo con 3 unidades en stock
- **WHEN** el cliente pide 4 unidades
- **THEN** se rechaza con el mensaje "Solo puedes tener 3 unidades de este artículo"

#### Scenario: Máximo por artículo
- **GIVEN** un artículo con 30 unidades en stock
- **WHEN** el cliente pide 11 unidades
- **THEN** se rechaza indicando que el máximo es 10

#### Scenario: Cantidad no válida
- **WHEN** el cliente pide 0 unidades o una cantidad que no es un número entero
- **THEN** se rechaza indicando que la cantidad debe ser un número entero mayor que cero

### Requirement: CART-003 Cambiar cantidades y eliminar
El cliente SHALL poder cambiar la cantidad de una línea dentro de sus límites y eliminarla. Poner la cantidad a 0 SHALL equivaler a eliminar la línea.

#### Scenario: Cambiar la cantidad
- **WHEN** el cliente cambia una línea de 2 a 4 unidades
- **THEN** la línea tiene 4 unidades y los totales se recalculan

#### Scenario: Eliminar una línea
- **WHEN** el cliente elimina una línea
- **THEN** desaparece del carrito y la cabecera descuenta sus unidades

#### Scenario: Línea inexistente
- **WHEN** se intenta cambiar por la API un artículo que no está en el carrito
- **THEN** la API responde 404

### Requirement: CART-004 Carrito del navegador
El carrito SHALL pertenecer al navegador que lo creó (cookie de sesión) y SHALL conservarse al recargar o navegar. Un navegador sin carrito SHALL ver un carrito vacío con un enlace al catálogo.

#### Scenario: El carrito se conserva
- **GIVEN** un carrito con artículos
- **WHEN** el cliente recarga la página o vuelve al catálogo
- **THEN** el carrito sigue con los mismos artículos

#### Scenario: Otro navegador
- **GIVEN** un carrito con artículos en un navegador
- **WHEN** se abre la tienda en otro navegador
- **THEN** su carrito está vacío y muestra "Tu carrito está vacío" con un enlace al catálogo

### Requirement: CART-005 Totales del carrito
El carrito SHALL mostrar subtotal, descuento, envío, total e IVA incluido (21 %, calculado como total − total / 1,21 redondeado al céntimo), todo en céntimos. El envío SHALL ser de 4,95 € y SHALL ser gratis cuando el subtotal menos el descuento sea de 50,00 € o más. Un carrito vacío no SHALL tener gastos de envío.

#### Scenario: Totales de un carrito
- **GIVEN** un carrito con 2 unidades de 19,90 €
- **WHEN** se consultan los totales
- **THEN** el subtotal es 39,80 €, el envío 4,95 € y el total 44,75 €, con 7,77 € de IVA incluido

#### Scenario: Carrito vacío
- **WHEN** se consultan los totales de un carrito vacío
- **THEN** todos los importes son 0,00 €
