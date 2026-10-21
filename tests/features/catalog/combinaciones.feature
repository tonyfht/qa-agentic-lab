# Diseñado por el agente Diseñador de casos (qa-disenador), QAL-003.
# Cuatro parámetros independientes: categoría (cocina, textil, ninguna) × precio (sin filtro, hasta 20 €, desde 20 €)
# × solo con stock (sí, no) × orden (precio ascendente, nombre, valoración) = 54 combinaciones.
# Pairwise con un arreglo ortogonal L9: 9 filas cubren todas las parejas de valores al menos una vez.
@catalog @api @p2 @CAT-003 @CAT-004 @CAT-005 @CAT-006
Feature: Combinaciones de filtros del catálogo
  Como cliente que combina varios filtros a la vez
  quiero que cualquier combinación devuelva solo artículos que la cumplen
  para confiar en lo que veo aunque use varios filtros juntos

  @pairwise
  Scenario Outline: Cualquier combinación de filtros devuelve solo artículos que la cumplen
    When pido por la API los artículos con "<consulta>"
    Then la API responde 200
    And todos los artículos cumplen los filtros "<consulta>"
    And la respuesta cumple el contrato publicado

    Examples:
      | consulta                                               |
      | category=cocina&inStock=1&sort=price-asc               |
      | category=cocina&maxPrice=20&sort=name                  |
      | category=cocina&minPrice=20&inStock=1&sort=rating      |
      | category=textil&sort=rating                            |
      | category=textil&maxPrice=20&inStock=1&sort=price-asc   |
      | category=textil&minPrice=20&inStock=1&sort=name        |
      | inStock=1&sort=name                                    |
      | maxPrice=20&inStock=1&sort=rating                      |
      | minPrice=20&sort=price-asc                             |
