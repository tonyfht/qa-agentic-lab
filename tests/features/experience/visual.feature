# Regresión visual (QAL-006). Las referencias son por sistema operativo y solo se aceptan por Pull Request revisado:
# se generan en Linux con el workflow "Referencias visuales". Sin referencia para el sistema actual, se omite.
@experience @visual @p2 @EXP-003
Feature: Regresión visual
  Como equipo de la tienda
  quiero detectar cambios visuales que nadie ha pedido
  para no publicar una página rota sin darme cuenta

  @clases-equivalencia
  Scenario Outline: La página coincide con su referencia aprobada
    When abro "<página>" para compararla
    Then la página coincide con la referencia "<referencia>"

    Examples:
      | página                       | referencia |
      | /                            | portada    |
      | /catalogo                    | catalogo   |
      | /producto/mantel-antimanchas | ficha      |
