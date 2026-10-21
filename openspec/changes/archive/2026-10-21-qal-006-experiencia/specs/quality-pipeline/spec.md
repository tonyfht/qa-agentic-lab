# Spec Delta — quality-pipeline

## ADDED Requirements

### Requirement: QA-019 Etapa de rendimiento y carga
El pipeline SHALL tener una etapa de rendimiento y carga, bloqueante, que levanta la tienda y ejecuta Lighthouse y la prueba de carga con el mismo comando en local y en CI, y SHALL dejar sus métricas en el resultado de la ejecución.

#### Scenario: Etapa en CI
- **WHEN** se ejecuta el pipeline en GitHub Actions
- **THEN** la etapa "Rendimiento y carga" aparece como un paso propio con su estado y sus métricas en el resumen

#### Scenario: Presupuesto incumplido
- **GIVEN** una página que supera su presupuesto de rendimiento
- **WHEN** se ejecuta la etapa
- **THEN** la etapa falla y la ejecución queda en rojo
