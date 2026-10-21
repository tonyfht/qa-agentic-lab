# Spec Delta — checkout

## ADDED Requirements

### Requirement: CHK-006 Pasos de la compra
El carrito, el pago y la confirmación del pedido SHALL mostrar los pasos de la compra (1 Carrito, 2 Envío y pago, 3 Confirmación). El paso actual SHALL marcarse con `aria-current="step"`.

#### Scenario: Paso actual en el pago
- **WHEN** abro la página de pago con un carrito con artículos
- **THEN** los pasos marcan "Envío y pago" como el actual

#### Scenario: Paso actual en el carrito
- **WHEN** abro el carrito con artículos
- **THEN** los pasos marcan "Carrito" como el actual
