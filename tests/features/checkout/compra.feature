# Escenarios del agente Analista y del Agente de API para la spec `checkout` (QAL-005).
# Cada escenario que compra usa un artículo exclusivo para no interferir con los que corren en paralelo.
@checkout
Feature: Checkout y pago simulado
  Como cliente
  quiero pagar mi carrito de forma segura
  para recibir mis artículos

  @CHK-004 @CHK-005 @e2e @p1 @smoke
  Scenario: Compra completa por la interfaz
    Given un cliente nuevo con sesión
    And un carrito con "marco-fotos-madera x2"
    When abro el carrito
    And tramito el pedido
    And relleno el envío con datos válidos
    And pago en la página con la tarjeta "4242 4242 4242 4242"
    Then veo el agradecimiento del pedido
    And el pedido muestra la tarjeta "•••• 4242"
    And la cabecera muestra "Carrito (0)"

  @CHK-004 @CHK-005 @api @p1
  Scenario: Compra completa por la API con stock, carrito y tarjeta enmascarada
    Given un cliente nuevo con sesión
    And anoto el stock de "velas-aromaticas-set"
    And un carrito con "velas-aromaticas-set x2"
    When pago por la API con la tarjeta "4242 4242 4242 4242", caducidad "12/30" y CVC "123"
    Then la API responde 201
    And la respuesta cumple el contrato publicado
    And el stock de "velas-aromaticas-set" ha bajado en 2
    And mi carrito está vacío
    And la respuesta del pedido no contiene "4242424242424242" ni el CVC

  @CHK-001 @api @p1 @clases-equivalencia
  Scenario Outline: Códigos postales no válidos
    Given un cliente nuevo con sesión
    And un carrito con "cojin-lino-natural x1"
    When pago por la API con el código postal "<cp>"
    Then la API responde 400
    And el error del campo "postalCode" es "<mensaje>"
    And la respuesta cumple el contrato publicado

    Examples:
      | cp    | mensaje                               |
      | 2801  | El código postal debe tener 5 dígitos |
      | 28A13 | El código postal debe tener 5 dígitos |
      |       | El código postal es obligatorio       |

  @CHK-001 @e2e @p2
  Scenario: El error de un campo aparece junto a él
    Given un cliente nuevo con sesión
    And un carrito con "cojin-lino-natural x1"
    When abro "/checkout"
    And relleno el envío con el código postal "2801"
    And pago en la página con la tarjeta "4242 4242 4242 4242"
    Then el campo "postalCode" explica "El código postal debe tener 5 dígitos"

  # Clases de equivalencia de tarjetas: cada una representa un motivo de rechazo distinto.
  @CHK-002 @api @p1 @clases-equivalencia
  Scenario Outline: Cada tarjeta de prueba rechazada tiene su motivo y no cambia nada
    Given un cliente nuevo con sesión
    And anoto el stock de "cojin-lino-natural"
    And un carrito con "cojin-lino-natural x1"
    When pago por la API con la tarjeta "<tarjeta>", caducidad "<caducidad>" y CVC "<cvc>"
    Then la API responde <estado>
    And el error explica "<motivo>"
    And la respuesta cumple el contrato publicado
    And el stock de "cojin-lino-natural" no ha cambiado
    And mi carrito sigue con 1 unidades

    Examples:
      | tarjeta             | caducidad | cvc | estado | motivo                            |
      | 4000 0000 0000 0002 | 12/30     | 123 | 402    | Tarjeta rechazada por el banco    |
      | 4000 0000 0000 9995 | 12/30     | 123 | 402    | Fondos insuficientes              |
      | 4242 4242 4242 4241 | 12/30     | 123 | 400    | El número de tarjeta no es válido |
      | 4242 4242 4242 4242 | 01/24     | 123 | 402    | La tarjeta ha caducado            |
      | 4242 4242 4242 4242 | 12/30     | 12  | 400    | El CVC debe tener 3 dígitos       |

  @CHK-003 @api @p1
  Scenario: Otro cliente compra antes la última unidad
    Given un cliente nuevo con sesión
    And todas las unidades de "lampara-pie-arco" en mi carrito
    And otro cliente compra 1 unidad de "lampara-pie-arco"
    When pago por la API con la tarjeta "4242 4242 4242 4242", caducidad "12/30" y CVC "123"
    Then la API responde 409
    And el error dice cuántas unidades quedan de "lampara-pie-arco"
    And la respuesta cumple el contrato publicado

  @CHK-003 @api @p2
  Scenario: No se puede pagar un carrito vacío
    Given un cliente nuevo con sesión
    When pago por la API con la tarjeta "4242 4242 4242 4242", caducidad "12/30" y CVC "123"
    Then la API responde 400
    And el error explica "Tu carrito está vacío"
