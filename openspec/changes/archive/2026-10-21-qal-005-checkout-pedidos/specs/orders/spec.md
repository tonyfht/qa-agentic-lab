# Spec Delta — orders

## Purpose

Define cómo un cliente consulta sus pedidos en La Tienda en Casa y cómo se protege que nadie vea los pedidos de otro.

## ADDED Requirements

### Requirement: ORD-001 Historial de pedidos
Un cliente con sesión SHALL ver sus pedidos, del más reciente al más antiguo, con número, fecha, número de unidades y total. Sin pedidos SHALL ver un mensaje con un enlace al catálogo.

#### Scenario: Cliente con pedidos
- **GIVEN** un cliente que ha hecho dos pedidos
- **WHEN** abre "Mis pedidos"
- **THEN** ve los dos, el más reciente primero

#### Scenario: Cliente sin pedidos
- **WHEN** un cliente recién registrado abre "Mis pedidos"
- **THEN** ve "Todavía no has hecho ningún pedido"

### Requirement: ORD-002 Detalle de pedido
Un cliente SHALL poder abrir el detalle de cada pedido suyo, con sus líneas, totales, envío y tarjeta enmascarada.

#### Scenario: Detalle del pedido
- **WHEN** el cliente abre uno de sus pedidos
- **THEN** ve sus líneas, el total pagado, la dirección de envío y "•••• 4242"

#### Scenario: Pedido inexistente
- **WHEN** el cliente abre un número de pedido que no existe
- **THEN** ve "Este pedido no existe"

### Requirement: ORD-003 Aislamiento entre clientes
Un cliente no SHALL poder ver los pedidos de otro. Pedir el pedido de otro cliente SHALL responder exactamente igual que pedir uno inexistente, para no revelar que existe.

#### Scenario: Pedido de otro cliente por la API
- **GIVEN** un pedido del cliente A
- **WHEN** el cliente B pide ese pedido por la API
- **THEN** la API responde 404 con el mismo mensaje que para un pedido inexistente

#### Scenario: La lista solo tiene pedidos propios
- **WHEN** el cliente B pide su lista de pedidos
- **THEN** no aparece ningún pedido del cliente A
