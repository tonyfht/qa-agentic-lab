@catalog @p1
Feature: Filtros del catálogo
  Como cliente
  quiero acotar el catálogo por categoría, precio y disponibilidad
  para ver solo lo que me interesa

  @CAT-003 @e2e
  Scenario: Filtrar por categoría
    When abro el catálogo
    And filtro por la categoría "Textil"
    And aplico los filtros
    Then todos los artículos son de la categoría "Textil"
    And veo el total "5 artículos"

  @CAT-003 @api
  Scenario: Categoría inexistente
    When pido por la API los artículos con "category=jardineria-espacial"
    Then la API responde 400
    And el error explica "La categoría «jardineria-espacial» no existe"
    And la respuesta cumple el contrato publicado

  @CAT-004 @api
  Scenario Outline: Los límites del rango de precio están incluidos
    When pido por la API los artículos entre <min> y <max> euros
    Then la API responde 200
    And todos cuestan entre <min> y <max> euros
    And la respuesta tiene <total> artículos
    And la respuesta cumple el contrato publicado

    Examples:
      | min   | max   | total |
      | 19.90 | 19.90 | 1     |
      | 19.91 | 20    | 0     |
      | 0     | 19.89 | 8     |

  @CAT-004 @api
  Scenario: Rango de precio invertido
    When pido por la API los artículos con "minPrice=50&maxPrice=10"
    Then la API responde 400
    And el error explica "El precio mínimo no puede ser mayor que el máximo"
    And la respuesta cumple el contrato publicado

  @CAT-004 @e2e
  Scenario: El aviso de rango invertido conserva el resto de filtros
    When abro el catálogo con "category=cocina&minPrice=50&maxPrice=10"
    Then veo el aviso "El precio mínimo no puede ser mayor que el máximo"
    And todos los artículos son de la categoría "Cocina"

  @CAT-005 @e2e
  Scenario: Solo artículos con stock
    When abro el catálogo
    And activo "Solo con stock"
    And aplico los filtros
    Then ningún artículo está agotado

  @CAT-005 @e2e
  Scenario: Los artículos agotados aparecen marcados sin el filtro
    When abro el catálogo con "sort=price-desc"
    Then algún artículo aparece marcado como "Agotado"
