# Spec Delta — qa-agents

## ADDED Requirements

### Requirement: QA-057 Cada agente declara qué hace y dónde interviene
Cada agente del registro SHALL declarar:
- un resumen de una frase de lo que hace;
- lo que tiene prohibido, en una frase;
- su familia (requisitos y diseño, automatización, auditoría, operación o salida);
- al menos una parada del flujo, sin repetir, entre las definidas.

El informe y la página de agentes SHALL leer esos datos del registro, sin copiarlos.

#### Scenario: Registro completo
- **WHEN** se comprueba el registro
- **THEN** los 11 agentes tienen resumen, prohibición, familia y paradas válidas

#### Scenario: Parada desconocida
- **GIVEN** un agente con una parada que no está en el flujo
- **WHEN** se ejecutan las pruebas
- **THEN** la prueba falla nombrando al agente y la parada
