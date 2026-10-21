# Escenario del agente Analista para CHK-006 (QAL-010): los pasos de la compra dicen dónde está el cliente.
@checkout
Feature: Pasos de la compra
  Como cliente
  quiero saber en qué paso de la compra estoy
  para saber cuánto me queda

  @CHK-006 @e2e @p2
  Scenario: Los pasos marcan dónde estoy
    Given un cliente nuevo con sesión
    And un carrito con "taza-desayuno-xl x1"
    When abro el carrito
    Then el paso actual es "Carrito"
    When abro "/checkout"
    Then el paso actual es "Envío y pago"
