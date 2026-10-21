# Spec Delta — quality-report

## ADDED Requirements

### Requirement: QA-018 Es usable y rápida
El informe SHALL responder a "¿Es usable y rápida?" con las puntuaciones de Lighthouse por página, la evolución del rendimiento entre ejecuciones, el p95 y la tasa de errores de la prueba de carga, y el número de violaciones de accesibilidad. Sin métricas SHALL explicar por qué faltan.

#### Scenario: Con métricas
- **GIVEN** una ejecución con métricas de Lighthouse y de carga
- **WHEN** se abre el informe
- **THEN** la sección muestra las puntuaciones por página, el p95 y la tasa de errores

#### Scenario: Sin métricas
- **GIVEN** una ejecución en la que la etapa de rendimiento no se ejecutó
- **WHEN** se abre el informe
- **THEN** la sección explica que no hay métricas de rendimiento en esta ejecución
