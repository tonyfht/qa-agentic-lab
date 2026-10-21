# Spec Delta — quality-report

## ADDED Requirements

### Requirement: QA-039 Agentes en el flujo
El informe SHALL tener el botón "Agentes de QA en este flujo", que abre `agentes.html` en otra pestaña. La página SHALL mostrar la línea del flujo con el estado de cada etapa en la ejecución, una calle por agente con sus paradas según el registro y una ficha por agente. Al elegir un agente, SHALL resaltar sus paradas y atenuar a los demás. SHALL funcionar sin red y con teclado, con una tabla alternativa.

#### Scenario: Abrir la página desde el informe
- **WHEN** pulso "Agentes de QA en este flujo" en el informe
- **THEN** se abre la página de agentes con la línea del flujo y los 11 agentes

#### Scenario: Elegir un agente
- **WHEN** elijo "Auditor de seguridad y cumplimiento"
- **THEN** solo la parada "Seguridad" queda marcada como suya, las calles de los demás agentes se atenúan y su ficha dice qué hace

#### Scenario: Estado de las etapas
- **GIVEN** una ejecución en la que falló la etapa "Smoke y E2E"
- **WHEN** abro la página de agentes
- **THEN** la parada "E2E" se muestra como fallida

#### Scenario: Alternativa accesible
- **WHEN** abro la tabla alternativa
- **THEN** cada agente aparece con las paradas en las que interviene
