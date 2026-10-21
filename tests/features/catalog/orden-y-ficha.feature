@catalog @p2
Feature: Ordenación y ficha de producto
  Como cliente
  quiero ordenar el catálogo y ver el detalle de un artículo
  para decidir qué comprar

  @CAT-006 @api
  Scenario: Precio ascendente
    When pido por la API los artículos con "sort=price-asc"
    Then la API responde 200
    And cada artículo cuesta lo mismo o más que el anterior
    And la respuesta cumple el contrato publicado

  @CAT-006 @api
  Scenario: Criterio de orden desconocido
    When pido por la API los artículos con "sort=aleatorio"
    Then la API responde 400
    And el error explica "Admitidos: relevance, price-asc, price-desc, name, rating"

  @CAT-007 @e2e
  Scenario: Ficha con pocas unidades
    When abro la ficha del artículo "mantel-antimanchas"
    Then veo el título "Mantel antimanchas"
    And veo "Quedan 3"

  @CAT-007 @e2e
  Scenario: Artículo inexistente en la interfaz
    When abro la ficha del artículo "no-existe"
    Then veo el título "Este artículo no existe"
    And hay un enlace "Ir al catálogo"

  @CAT-007 @api
  Scenario: Artículo inexistente en la API
    When pido por la API el artículo "no-existe"
    Then la API responde 404
    And la respuesta cumple el contrato publicado
