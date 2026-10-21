# Spec Delta — checkout

## Purpose

Define cómo un cliente paga su carrito en La Tienda en Casa: datos de envío, pago simulado con tarjetas de prueba,
comprobación de stock al confirmar y qué se guarda (y qué no) de la tarjeta.

## ADDED Requirements

### Requirement: CHK-001 Datos de envío
El checkout SHALL pedir nombre completo, dirección, ciudad y código postal, todos obligatorios. El código postal SHALL tener 5 dígitos. Cada dato incorrecto SHALL señalarse junto a su campo.

#### Scenario: Datos correctos
- **WHEN** el cliente rellena nombre, dirección, ciudad y el código postal "28013"
- **THEN** los datos de envío se aceptan

#### Scenario: Código postal no válido
- **WHEN** el cliente escribe el código postal "2801"
- **THEN** se rechaza con "El código postal debe tener 5 dígitos" junto al campo

#### Scenario: Campos vacíos
- **WHEN** el cliente confirma sin rellenar la dirección
- **THEN** se rechaza con "La dirección es obligatoria"

### Requirement: CHK-002 Pago simulado
El pago SHALL simularse con tarjetas de prueba: `4242 4242 4242 4242` se aprueba; `4000 0000 0000 0002` se rechaza ("Tarjeta rechazada por el banco"); `4000 0000 0000 9995` se rechaza por fondos insuficientes; cualquier otro número que supere el algoritmo de Luhn se aprueba y uno que no lo supere SHALL rechazarse como no válido. Una fecha de caducidad pasada SHALL rechazarse y el CVC SHALL tener 3 dígitos. Un pago rechazado no SHALL crear pedido ni cambiar el stock ni el carrito.

#### Scenario: Tarjeta aprobada
- **WHEN** el cliente paga con 4242 4242 4242 4242, caducidad futura y CVC de 3 dígitos
- **THEN** se crea el pedido

#### Scenario: Tarjeta rechazada
- **WHEN** el cliente paga con 4000 0000 0000 0002
- **THEN** ve "Tarjeta rechazada por el banco", no se crea pedido y su carrito sigue igual

#### Scenario: Número no válido
- **WHEN** el cliente paga con 4242 4242 4242 4241
- **THEN** ve "El número de tarjeta no es válido"

#### Scenario: Tarjeta caducada
- **WHEN** el cliente paga con una caducidad anterior al mes actual
- **THEN** ve "La tarjeta ha caducado"

### Requirement: CHK-003 Stock al confirmar
Al confirmar el pago, el stock de cada línea SHALL comprobarse de nuevo. Si alguna línea supera el stock disponible, el pago no SHALL hacerse y el cliente SHALL ver qué artículo y cuántas unidades quedan.

#### Scenario: Otro cliente compra antes la última unidad
- **GIVEN** un artículo con 2 unidades y un cliente con 2 en su carrito
- **WHEN** otro cliente compra 1 unidad y después el primero intenta pagar
- **THEN** el pago no se hace y el primero ve que de ese artículo solo queda 1 unidad

#### Scenario: Carrito vacío
- **WHEN** un cliente intenta pagar con el carrito vacío
- **THEN** se rechaza con "Tu carrito está vacío"

### Requirement: CHK-004 Pedido confirmado
Un pago aprobado SHALL, en una sola operación, crear el pedido con su número (TC-000001…), las líneas con el precio de ese momento, los totales, el cupón y los datos de envío; descontar el stock y vaciar el carrito. El cliente SHALL ver la confirmación con el número de pedido.

#### Scenario: Compra completa
- **GIVEN** un cliente con sesión y 2 unidades de "Set de 3 velas aromáticas" en el carrito
- **WHEN** paga con la tarjeta aprobada
- **THEN** ve "Gracias por tu pedido" con su número, el stock del artículo baja en 2 y su carrito queda vacío

#### Scenario: El pedido conserva el precio pagado
- **WHEN** se consulta un pedido antiguo
- **THEN** muestra los precios y totales del momento de la compra

### Requirement: CHK-005 La tarjeta no se guarda
La tienda no SHALL guardar ni devolver el número completo de la tarjeta ni el CVC. El pedido SHALL guardar solo la marca de prueba y los cuatro últimos dígitos.

#### Scenario: Pedido con tarjeta enmascarada
- **WHEN** se consulta un pedido pagado con 4242 4242 4242 4242
- **THEN** muestra "•••• 4242" y la respuesta de la API no contiene el número completo ni el CVC

#### Scenario: Error sin datos de tarjeta
- **WHEN** un pago se rechaza
- **THEN** el mensaje de error no repite el número de tarjeta
