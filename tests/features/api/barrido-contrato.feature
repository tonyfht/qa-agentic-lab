# Barrido de contrato del Agente de API (qa-api), QAL-005: recorre el contrato publicado y valida cada lectura
# pública. Una operación nueva queda cubierta sin escribir un test para ella.
@api @p2 @QA-047
Feature: Barrido de contrato
  Como equipo de calidad
  quiero que cada lectura pública de la API se valide contra su contrato automáticamente
  para que una operación nueva no quede sin probar

  Scenario: Todas las lecturas públicas cumplen su contrato
    When recorro las operaciones de lectura públicas del contrato
    Then todas responden 200 y cumplen su esquema publicado
    And el barrido ha cubierto al menos 4 operaciones
