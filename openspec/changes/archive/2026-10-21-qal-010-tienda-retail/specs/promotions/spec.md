# Spec Delta — promotions

## ADDED Requirements

### Requirement: PROMO-005 Progreso hacia el envío gratis
El carrito SHALL mostrar una barra de progreso hacia el envío gratis (PROMO-003). La barra SHALL tener el porcentaje del subtotal con descuento sobre 50,00 €, con un máximo del 100 %, y su texto accesible. Al alcanzarlo, SHALL decir "Tienes envío gratis".

#### Scenario: A medio camino
- **GIVEN** un carrito con subtotal de 25,00 € sin descuento
- **WHEN** abro el carrito
- **THEN** la barra está al 50 % y dice que faltan 25,00 € para el envío gratis

#### Scenario: Envío gratis alcanzado
- **GIVEN** un carrito con subtotal de 60,00 €
- **WHEN** abro el carrito
- **THEN** la barra está al 100 % y dice "Tienes envío gratis"
