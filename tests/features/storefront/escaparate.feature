# Escenarios del agente Analista para la spec `storefront` (QAL-010): lo que hace que La Tienda en Casa se use como
# una tienda online. Los datos (las fotos y sus créditos) se comprueban además en las pruebas unitarias.
@storefront
Feature: Escaparate de la tienda
  Como cliente
  quiero encontrar rápido lo que busco y ver bien los artículos
  para comprar con confianza

  @SHOP-001 @e2e @p1
  Scenario: Buscar desde la cabecera en cualquier página
    When abro la ficha del artículo "mantel-antimanchas"
    And busco "lino" en la cabecera
    Then estoy en el catálogo buscando "lino"
    And aparece el artículo "Cojín de lino natural"

  @SHOP-001 @e2e @p2
  Scenario: Elegir una categoría en el menú de la cabecera
    When abro la portada de la tienda
    And elijo "Iluminación" en el menú de categorías
    Then todos los artículos son de la categoría "Iluminación"

  @SHOP-002 @e2e @p2
  Scenario: La portada invita a comprar
    When abro la portada de la tienda
    Then la portada ofrece las 5 categorías
    And "Mejor valorados" muestra 4 artículos con stock
    And "Novedades" no repite ningún artículo de "Mejor valorados"

  @SHOP-003 @e2e @p2
  Scenario: La ficha tiene una foto servida por la propia tienda
    When abro la ficha del artículo "mantel-antimanchas"
    Then la foto principal describe el artículo y la sirve la propia tienda

  @SHOP-004 @e2e @p3
  Scenario: Los créditos de las fotos desde el pie
    When abro la portada de la tienda
    And sigo "Créditos de las fotos" en el pie
    Then veo los créditos de 31 fotos con su autor y su licencia
