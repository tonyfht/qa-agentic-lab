# Escenarios escritos por el agente Analista (qa-analista) a partir de la spec `cart` (QAL-004).
# Las tablas con técnica las diseñó el agente Diseñador de casos (qa-disenador).
@cart
Feature: Carrito
  Como cliente de La Tienda en Casa
  quiero guardar en un carrito lo que voy a comprar
  para revisarlo antes de pagar

  @CART-001 @e2e @p1 @smoke
  Scenario: Añadir un artículo desde su ficha
    When abro la ficha del artículo "manta-punto-gruesa"
    And añado 2 unidades al carrito
    Then la cabecera muestra "Carrito (2)"
    When abro el carrito
    Then el carrito tiene una línea de "Manta de punto gruesa" con 2 unidades

  @CART-001 @api @p1
  Scenario: Añadir un artículo que ya estaba suma las unidades
    When añado por la API 1 unidades de "taza-desayuno-xl"
    And añado por la API 2 unidades de "taza-desayuno-xl"
    Then la API responde 200
    And el carrito tiene 1 línea con 3 unidades de "taza-desayuno-xl"
    And la respuesta cumple el contrato publicado

  @CART-001 @api @p1
  Scenario: Un artículo agotado no se puede añadir
    When añado por la API 1 unidades de "sarten-antiadherente-28"
    Then la API responde 409
    And el error explica "Este artículo está agotado"
    And la respuesta cumple el contrato publicado

  # Valores límite: el stock (3 unidades) y el máximo por artículo (10), en el límite y uno por encima.
  @CART-002 @api @p1 @valores-limite
  Scenario Outline: Límite de unidades por artículo
    When añado por la API <cantidad> unidades de "<artículo>"
    Then la API responde <estado>
    And la respuesta cumple el contrato publicado

    Examples:
      | artículo           | cantidad | estado |
      | mantel-antimanchas | 3        | 200    |
      | mantel-antimanchas | 4        | 409    |
      | taza-desayuno-xl   | 10       | 200    |
      | taza-desayuno-xl   | 11       | 409    |

  @CART-002 @api @p2
  Scenario: El rechazo dice cuántas unidades se pueden tener
    When añado por la API 4 unidades de "mantel-antimanchas"
    Then el error explica "Solo puedes tener 3 unidades de este artículo"

  # Clases de equivalencia de la cantidad: cero, negativa, decimal y no numérica (todas inválidas).
  @CART-002 @api @p2 @clases-equivalencia
  Scenario Outline: Cantidades que no son un entero positivo
    When añado por la API la cantidad <cantidad> de "taza-desayuno-xl"
    Then la API responde 400
    And el error explica "La cantidad debe ser un número entero mayor que cero"
    And la respuesta cumple el contrato publicado

    Examples:
      | cantidad |
      | 0        |
      | -1       |
      | 1.5      |
      | "dos"    |

  @CART-003 @e2e @p1
  Scenario: Cambiar la cantidad y eliminar una línea
    Given un carrito con "manta-punto-gruesa x2, taza-desayuno-xl x1"
    When abro el carrito
    And cambio la cantidad de "Manta de punto gruesa" a 4
    Then el carrito tiene una línea de "Manta de punto gruesa" con 4 unidades
    When elimino "Taza de desayuno XL" del carrito
    Then la cabecera muestra "Carrito (4)"

  @CART-003 @api @p2
  Scenario: Cambiar un artículo que no está en el carrito
    When cambio por la API la cantidad de "jarron-ceramica-blanco" a 2
    Then la API responde 404
    And la respuesta cumple el contrato publicado

  @CART-004 @e2e @p1
  Scenario: El carrito se conserva al recargar y no se comparte con otro navegador
    Given un carrito con "lampara-mesa-ceramica x1"
    When abro el carrito
    And recargo la página
    Then el carrito tiene una línea de "Lámpara de mesa de cerámica" con 1 unidades
    When abro la tienda en otro navegador
    Then ese navegador ve "Tu carrito está vacío"
