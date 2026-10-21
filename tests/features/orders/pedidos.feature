# Escenarios del agente Analista y del Agente de API para la spec `orders` (QAL-005).
@orders
Feature: Mis pedidos
  Como cliente
  quiero consultar mis pedidos y que nadie más pueda verlos
  para saber qué he comprado con tranquilidad

  @ORD-001 @api @p1
  Scenario: Los pedidos aparecen del más reciente al más antiguo
    Given un cliente nuevo con sesión
    And ha comprado "guirnalda-luces-led x1"
    And ha comprado "guirnalda-luces-led x1"
    When pido por la API mis pedidos
    Then la API responde 200
    And tengo 2 pedidos, el más reciente primero
    And la respuesta cumple el contrato publicado

  @ORD-001 @e2e @p2
  Scenario: Un cliente sin pedidos
    Given un cliente nuevo con sesión
    When abro "/cuenta/pedidos"
    Then veo "Todavía no has hecho ningún pedido."

  @ORD-002 @api @p2
  Scenario: Detalle de un pedido propio
    Given un cliente nuevo con sesión
    And ha comprado "guirnalda-luces-led x1"
    When pido por la API el detalle de mi último pedido
    Then la API responde 200
    And la respuesta cumple el contrato publicado

  @ORD-002 @e2e @p2
  Scenario: Un pedido que no existe
    Given un cliente nuevo con sesión
    When abro "/cuenta/pedidos/TC-999999"
    Then veo el título "Este pedido no existe"

  @ORD-003 @api @p1
  Scenario: El pedido de otro cliente responde igual que uno inexistente
    Given otro cliente ha hecho un pedido de "toallas-algodon-pack x1"
    And un cliente nuevo con sesión
    When pido por la API el pedido del otro cliente
    Then la API responde 404
    And la respuesta es idéntica a la de un pedido inexistente
    And la respuesta cumple el contrato publicado
    When pido por la API mis pedidos
    Then no aparece el pedido del otro cliente
