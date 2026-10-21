# Escenarios del agente Analista para los requisitos de carrito y envío de QAL-010: añadir desde la tarjeta, carrito
# vacío con sugerencias y barra de envío gratis. El 19 % sale de 9,90 € sobre 50,00 €, redondeado hacia abajo.
@cart
Feature: Carrito de tienda online
  Como cliente
  quiero añadir sin perder el sitio y saber cuánto me falta para el envío gratis
  para comprar más rápido y mejor

  @CART-006 @e2e @p1
  Scenario: Añadir desde la tarjeta sin salir del catálogo
    When abro el catálogo
    And añado "Cafetera italiana de aluminio" desde su tarjeta
    Then sigo en el catálogo
    And la tarjeta avisa "Añadido al carrito"
    And la cabecera muestra "Carrito (1)"

  @CART-006 @e2e @p2
  Scenario: Un artículo agotado no se puede añadir desde su tarjeta
    When abro el catálogo con "sort=price-desc"
    Then algún artículo aparece marcado como "Agotado"
    And ninguna tarjeta agotada tiene botón de añadir

  @CART-007 @e2e @p2
  Scenario: El carrito vacío sugiere artículos que se pueden añadir
    When abro el carrito
    Then veo el título "Tu carrito está vacío"
    And veo 4 sugerencias
    When añado la primera sugerencia
    Then el carrito tiene la sugerencia con 1 unidad

  @PROMO-005 @e2e @p2
  Scenario: La barra muestra lo que falta para el envío gratis
    Given un carrito con "taza-desayuno-xl x1"
    When abro el carrito
    Then la barra de envío gratis está al 19 %
    And la página indica que faltan "40,10 €" para el envío gratis

  @PROMO-005 @e2e @p2
  Scenario: Con el envío gratis alcanzado la barra está completa
    Given un carrito con "lampara-pie-arco x1"
    When abro el carrito
    Then la barra de envío gratis está al 100 %
    And veo "Tienes envío gratis"
