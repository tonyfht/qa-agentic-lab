@catalog @CAT-002 @p1
Feature: Búsqueda por texto
  Como cliente
  quiero buscar sin preocuparme de tildes ni mayúsculas
  para encontrar lo que tengo en la cabeza

  @e2e @clases-equivalencia
  Scenario Outline: La búsqueda no distingue mayúsculas ni tildes
    When abro el catálogo
    And busco "<texto>"
    Then aparece el artículo "<artículo>"

    Examples:
      | texto     | artículo                      |
      | cafetera  | Cafetera italiana de aluminio |
      | CAFETERA  | Cafetera italiana de aluminio |
      | algodón   | Funda nórdica lisa            |

  @e2e
  Scenario: Búsqueda sin resultados
    When abro el catálogo
    And busco "submarino"
    Then veo el mensaje "No hemos encontrado artículos"
    And hay un enlace "Ver todo el catálogo"

  @api
  Scenario: La API busca en nombre y descripción
    When pido por la API los artículos con "q=algodon"
    Then la API responde 200
    And la respuesta incluye el artículo "funda-nordica-lisa"
    And la respuesta cumple el contrato publicado
