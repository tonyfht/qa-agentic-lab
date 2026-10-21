@catalog @p1
Feature: Listado del catálogo
  Como cliente de La Tienda en Casa
  quiero ver el catálogo por páginas
  para recorrer los artículos sin perderme

  @CAT-001 @e2e @smoke
  Scenario: Primera página del catálogo
    When abro el catálogo
    Then veo 12 artículos en la página
    And veo el total "24 artículos"
    When voy a la página siguiente
    Then veo 12 artículos en la página

  @CAT-001 @e2e
  Scenario: Página fuera de rango
    When abro el catálogo con "page=9"
    Then veo el mensaje "No hemos encontrado artículos"
    And hay un enlace "Volver a la primera página"

  @CAT-001 @api
  Scenario: La API pagina de 12 en 12
    When pido por la API los artículos con "page=2"
    Then la API responde 200
    And la respuesta tiene 12 artículos de un total de 24
    And la respuesta cumple el contrato publicado
