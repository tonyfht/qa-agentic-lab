# Spec Delta — lab-guide

## ADDED Requirements

### Requirement: QA-056 Presentación de los agentes
El README SHALL tener la sección "Conoce a los agentes", con una presentación por cada agente del registro, en el orden del ciclo. Cada presentación SHALL decir:
- quién es;
- qué hace;
- en qué paradas del flujo interviene;
- qué tiene prohibido.

SHALL enlazar también a una muestra real de su trabajo y a su definición.

#### Scenario: Todos los agentes presentados
- **WHEN** se comprueba el README
- **THEN** cada agente del registro tiene su presentación con enlace a su definición

#### Scenario: Agente nuevo sin presentar
- **GIVEN** un agente añadido al registro sin presentación en el README
- **WHEN** se ejecutan las pruebas
- **THEN** la prueba falla nombrando al agente
