# Spec Delta — qa-agents

## ADDED Requirements

### Requirement: QA-048 Auditor de experiencia
El Auditor de experiencia SHALL leer las métricas de accesibilidad, rendimiento, regresión visual y carga de una ejecución y producir hallazgos priorizados en lenguaje de negocio, sin cambiar presupuestos ni umbrales.

#### Scenario: Auditoría de una ejecución
- **WHEN** el Auditor revisa las métricas de una ejecución
- **THEN** deja un informe con un hallazgo por fila, su impacto para el cliente y una propuesta

#### Scenario: El Auditor no relaja presupuestos
- **GIVEN** un presupuesto incumplido
- **WHEN** el Auditor lo revisa
- **THEN** lo explica y propone cómo corregir la causa, sin modificar el presupuesto
