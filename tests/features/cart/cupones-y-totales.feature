# Escenarios escritos por el agente Analista (qa-analista) a partir de las specs `cart` y `promotions` (QAL-004).
# Tabla de decisión y clases de equivalencia diseñadas por el agente Diseñador de casos (qa-disenador).
@cart @promotions
Feature: Cupones, envío y totales
  Como cliente
  quiero saber cuánto voy a pagar y por qué
  para no llevarme sorpresas al pagar

  @CART-005 @api @p1
  Scenario: Totales de un carrito
    Given un carrito con "manta-punto-gruesa x2"
    When consulto el carrito por la API
    Then el subtotal es "39,80 €"
    And el envío es "4,95 €"
    And el total es "44,75 €"
    And el IVA incluido es "7,77 €"
    And la respuesta cumple el contrato publicado

  @CART-005 @e2e @p1
  Scenario: El resumen del carrito muestra los totales
    Given un carrito con "manta-punto-gruesa x2"
    When abro el carrito
    Then la página muestra el total "44,75 €"
    And la página indica que faltan "10,20 €" para el envío gratis

  # Tabla de decisión: existe × vigente × aplicable × mínimo. Una fila por regla; se informa la primera que falla.
  @PROMO-002 @api @p1 @tabla-decision
  Scenario Outline: Cada condición incumplida tiene su propio motivo
    Given un carrito con "<contenido>"
    When aplico por la API el cupón "<cupón>"
    Then la API responde 400
    And el error explica "<motivo>"
    And la respuesta cumple el contrato publicado

    Examples:
      | contenido                | cupón        | motivo                                      |
      | taza-desayuno-xl x1      | REGALO100    | El cupón REGALO100 no existe                |
      | jarron-ceramica-blanco x1 | VERANO2026  | El cupón VERANO2026 caducó el 30/09/2026    |
      | taza-desayuno-xl x1      | TEXTIL15     | TEXTIL15 solo se aplica a artículos de Textil |
      | taza-desayuno-xl x1      | BIENVENIDA10 | BIENVENIDA10 necesita una compra mínima de 30,00 € |

  @PROMO-001 @api @p1
  Scenario: Un cupón válido descuenta y se escribe sin importar mayúsculas ni espacios
    Given un carrito con "taza-desayuno-xl x4"
    When aplico por la API el cupón " bienvenida10 "
    Then la API responde 200
    And el descuento es "3,96 €"
    And la respuesta cumple el contrato publicado

  @PROMO-001 @e2e @p2
  Scenario: Aplicar, cambiar y quitar el cupón en la página
    Given un carrito con "funda-nordica-lisa x1"
    When abro el carrito
    And aplico en la página el cupón "BIENVENIDA10"
    Then la página muestra el descuento "-3,99 €"
    When aplico en la página el cupón "CASA5"
    Then la página muestra el descuento "-5,00 €"
    When quito el cupón en la página
    Then la página muestra el descuento "0,00 €"

  @PROMO-002 @e2e @p2
  Scenario: Si el carrito baja del mínimo, el cupón deja de descontar y se explica
    Given un carrito con "funda-nordica-lisa x1"
    And el cupón "BIENVENIDA10" aplicado
    When dejo en el carrito solo "taza-desayuno-xl x1"
    And abro el carrito
    Then veo el aviso del cupón "BIENVENIDA10 necesita una compra mínima de 30,00 €"
    And la página muestra el descuento "0,00 €"

  # Clases de equivalencia del envío. El límite exacto (49,99 / 50,00 €) está en las pruebas unitarias:
  # todos los precios de ejemplo terminan en ,90 y ninguna combinación suma exactamente 50,00 €.
  @PROMO-003 @api @p1 @clases-equivalencia
  Scenario Outline: Envío gratis desde 50 € después del descuento
    Given un carrito con "<contenido>"
    And el cupón "<cupón>" aplicado
    When consulto el carrito por la API
    Then el envío es "<envío>"

    Examples:
      | contenido                                    | cupón        | envío  |
      | lampara-mesa-ceramica x1                     | ninguno      | 4,95 € |
      | funda-nordica-lisa x1, alfombra-bano-algodon x1 | ninguno   | 0,00 € |
      | funda-nordica-lisa x1, alfombra-bano-algodon x1 | BIENVENIDA10 | 4,95 € |
      | taza-desayuno-xl x1                          | ENVIOGRATIS  | 0,00 € |

  @PROMO-004 @api @p2
  Scenario: Un cupón de categoría solo descuenta sobre esa categoría
    Given un carrito con "manta-punto-gruesa x1, taza-desayuno-xl x1"
    When aplico por la API el cupón "TEXTIL15"
    Then la API responde 200
    And el descuento es "2,99 €"
    And la respuesta cumple el contrato publicado
