# Spec Delta — quality-report

## ADDED Requirements

### Requirement: QA-017 Qué ha hecho la IA
El informe SHALL responder a "¿Qué ha hecho la IA?" con el número de actuaciones por agente y la lista de las últimas actuaciones con su cambio, sus artefactos y su resumen. Sin actuaciones registradas SHALL explicarlo en lugar de mostrar un gráfico vacío.

#### Scenario: Actuaciones registradas
- **GIVEN** un resultado con actuaciones de dos agentes
- **WHEN** se abre el informe
- **THEN** la sección "¿Qué ha hecho la IA?" muestra cuántas actuaciones tiene cada agente y las últimas con su resumen

#### Scenario: Sin actuaciones
- **GIVEN** un resultado sin actuaciones de agentes
- **WHEN** se abre el informe
- **THEN** la sección explica que todavía no hay actuaciones registradas
