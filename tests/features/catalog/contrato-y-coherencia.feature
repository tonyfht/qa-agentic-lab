@catalog @p1
Feature: Contrato de la API y coherencia con la interfaz
  Como sistema que integra con la tienda
  quiero que la API cumpla su contrato y diga lo mismo que la web
  para poder confiar en ella

  @CAT-008 @api
  Scenario: Las operaciones del catálogo cumplen el contrato
    When pido por la API las categorías
    Then la API responde 200
    And la respuesta cumple el contrato publicado
    When pido por la API el artículo "manta-punto-gruesa"
    Then la API responde 200
    And la respuesta cumple el contrato publicado

  @CAT-009 @e2e @api
  Scenario: Interfaz y API devuelven lo mismo
    When busco en la interfaz y en la API con "q=taza&category=cocina&sort=price-desc"
    Then las dos listas tienen los mismos artículos en el mismo orden

  @CAT-009 @e2e
  Scenario: Un orden desconocido en la URL no rompe la página
    When abro el catálogo con "sort=aleatorio"
    Then veo el aviso "Orden «aleatorio» desconocido"
    And veo 12 artículos en la página
