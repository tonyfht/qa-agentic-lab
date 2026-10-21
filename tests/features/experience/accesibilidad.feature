# Escenarios del agente Analista para la spec `experience` (QAL-006). Cada tipo de página es una clase de
# equivalencia: si una página de un tipo es accesible, sus hermanas comparten plantilla y componentes.
@experience @p1
Feature: Accesibilidad y uso con teclado
  Como persona que usa un lector de pantalla o solo el teclado
  quiero poder recorrer y comprar en la tienda
  para no quedarme fuera por cómo está hecha la web

  @EXP-001 @a11y @clases-equivalencia
  Scenario Outline: Las páginas clave no tienen barreras graves de accesibilidad
    When abro "<página>"
    Then la página no tiene violaciones de accesibilidad graves ni críticas

    Examples:
      | página                       |
      | /                            |
      | /catalogo                    |
      | /catalogo?q=submarino        |
      | /producto/mantel-antimanchas |
      | /carrito                     |
      | /cuenta/entrar               |
      | /cuenta/registro             |

  @EXP-001 @a11y
  Scenario: El carrito con artículos y el pago son accesibles
    Given un cliente nuevo con sesión
    And un carrito con "jarron-ceramica-blanco x1"
    When abro el carrito
    Then la página no tiene violaciones de accesibilidad graves ni críticas
    When abro "/checkout"
    Then la página no tiene violaciones de accesibilidad graves ni críticas

  @EXP-002 @e2e
  Scenario: Añadir al carrito solo con el teclado
    When abro la ficha del artículo "jarron-ceramica-blanco"
    And llego con el tabulador al botón "Añadir al carrito"
    Then el elemento con el foco tiene un indicador visible
    When pulso Intro
    Then veo el aviso de que se ha añadido al carrito
