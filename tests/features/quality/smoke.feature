@QA-001 @e2e @smoke @p1
Feature: La tienda arranca y responde
  Como equipo de calidad
  quiero comprobar en cada ejecución que la tienda está viva
  para no lanzar pruebas contra una aplicación caída

  Scenario: La API responde a la comprobación de salud
    When consulto el estado de salud de la API
    Then la respuesta es correcta
    And indica la versión de la aplicación

  Scenario: La portada muestra la marca
    When abro la portada de la tienda
    Then veo el nombre "La Tienda en Casa"
