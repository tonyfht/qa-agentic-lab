# Escenarios del agente Analista para los requisitos de catálogo de QAL-010: filtros inmediatos, chips, cajón en el
# móvil y artículos relacionados.
@catalog
Feature: Catálogo cómodo de usar
  Como cliente
  quiero filtrar sin pasos de más, también en el móvil
  para llegar antes al artículo que me interesa

  @CAT-010 @e2e @p2
  Scenario: Elegir la categoría filtra sin pulsar Aplicar
    When abro el catálogo
    And elijo la categoría "Textil" sin aplicar
    Then la dirección incluye "category=textil"
    And todos los artículos son de la categoría "Textil"

  @CAT-010 @e2e @p2
  Scenario: Quitar un filtro con su chip conserva los demás
    When abro el catálogo con "category=textil&inStock=1"
    And quito el filtro "Textil"
    Then la dirección no incluye "category="
    And el filtro "Solo con stock" sigue activo

  @CAT-011 @e2e @p2
  Scenario: En el móvil los filtros están en un cajón que se cierra con Escape
    Given una pantalla de 390 px de ancho
    When abro el catálogo
    Then el primer artículo se ve sin desplazarse
    And los filtros están ocultos tras el botón "Filtros"
    When abro los filtros
    Then el foco está en el cajón de filtros
    When pulso Escape
    Then el cajón se cierra y el foco vuelve al botón "Filtros"

  @CAT-011 @a11y @p2
  Scenario: El cajón de filtros abierto es accesible
    Given una pantalla de 390 px de ancho
    When abro el catálogo
    And abro los filtros
    Then la página no tiene violaciones de accesibilidad graves ni críticas

  @CAT-012 @e2e @p2
  Scenario: La ficha sugiere artículos de la misma categoría
    When abro la ficha del artículo "mantel-antimanchas"
    Then veo hasta 4 relacionados de "Textil" sin el "Mantel antimanchas"

  @EXP-006 @performance @p2
  Scenario: Solo las primeras fotos del catálogo se cargan con prioridad
    When abro el catálogo
    Then las 2 primeras fotos se cargan con prioridad y las demás en diferido
