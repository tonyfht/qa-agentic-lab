# Spec Delta — promotions

## Purpose

Define los cupones y el envío gratis de La Tienda en Casa: qué descuentos existen, cuándo se pueden aplicar y qué
explica la tienda cuando no se pueden.

## ADDED Requirements

### Requirement: PROMO-001 Aplicar un cupón
El cliente SHALL poder aplicar un cupón por carrito escribiendo su código, sin distinguir mayúsculas ni espacios alrededor. Aplicar otro cupón SHALL sustituir al anterior, y el cliente SHALL poder quitarlo.

#### Scenario: Cupón válido
- **GIVEN** un carrito con 40,00 € de subtotal
- **WHEN** el cliente aplica " bienvenida10 "
- **THEN** se aplica BIENVENIDA10 con 4,00 € de descuento

#### Scenario: Cambiar de cupón
- **GIVEN** un carrito con BIENVENIDA10 aplicado
- **WHEN** el cliente aplica CASA5
- **THEN** el carrito tiene solo CASA5

#### Scenario: Quitar el cupón
- **WHEN** el cliente quita el cupón
- **THEN** el descuento vuelve a 0,00 €

### Requirement: PROMO-002 Validación de cupones
Un cupón SHALL aplicarse solo si existe, está vigente, el carrito contiene algo a lo que se aplique y el subtotal alcanza su mínimo, comprobado en ese orden; el cliente SHALL ver el motivo de la primera condición que falle. Si un cupón aplicado deja de cumplirse, SHALL dejar de descontar y el carrito SHALL explicar por qué.

#### Scenario: Cupón inexistente
- **WHEN** el cliente aplica "REGALO100"
- **THEN** se rechaza con "El cupón REGALO100 no existe"

#### Scenario: Cupón caducado
- **WHEN** el cliente aplica VERANO2026
- **THEN** se rechaza con "El cupón VERANO2026 caducó el 30/09/2026"

#### Scenario: Mínimo no alcanzado
- **GIVEN** un carrito con 29,99 € de subtotal
- **WHEN** el cliente aplica BIENVENIDA10
- **THEN** se rechaza con "BIENVENIDA10 necesita una compra mínima de 30,00 €"

#### Scenario: Cupón sin artículos a los que aplicarse
- **GIVEN** un carrito sin artículos de textil
- **WHEN** el cliente aplica TEXTIL15
- **THEN** se rechaza con "TEXTIL15 solo se aplica a artículos de Textil"

#### Scenario: El carrito baja del mínimo
- **GIVEN** un carrito con BIENVENIDA10 aplicado y 40,00 € de subtotal
- **WHEN** el cliente elimina artículos y el subtotal queda en 20,00 €
- **THEN** el descuento es 0,00 € y el carrito explica que falta llegar al mínimo de 30,00 €

### Requirement: PROMO-003 Envío gratis
El envío SHALL ser gratis cuando el subtotal menos el descuento sea de 50,00 € o más, o cuando el cupón aplicado sea ENVIOGRATIS. En otro caso SHALL costar 4,95 €.

#### Scenario: Justo en el umbral
- **GIVEN** un carrito con 50,00 € después del descuento
- **WHEN** se calculan los totales
- **THEN** el envío es gratis

#### Scenario: Un céntimo por debajo
- **GIVEN** un carrito con 49,99 € después del descuento
- **WHEN** se calculan los totales
- **THEN** el envío cuesta 4,95 €

#### Scenario: El descuento hace bajar del umbral
- **GIVEN** un carrito con 54,00 € de subtotal y BIENVENIDA10 aplicado
- **WHEN** se calculan los totales
- **THEN** quedan 48,60 € después del descuento y el envío cuesta 4,95 €

### Requirement: PROMO-004 Cupón por categoría
Un cupón de categoría SHALL descontar solo sobre el importe de las líneas de esa categoría, redondeando el descuento al céntimo más cercano.

#### Scenario: Descuento solo en textil
- **GIVEN** un carrito con una manta de 19,90 € (Textil) y una taza de 9,90 € (Cocina)
- **WHEN** el cliente aplica TEXTIL15
- **THEN** el descuento es de 2,99 € (15 % de 19,90 €, redondeado)

#### Scenario: Sin líneas de la categoría al quitar artículos
- **GIVEN** un carrito con TEXTIL15 aplicado
- **WHEN** el cliente elimina la última línea de textil
- **THEN** el descuento es 0,00 € y el carrito explica que el cupón no se aplica a lo que queda
