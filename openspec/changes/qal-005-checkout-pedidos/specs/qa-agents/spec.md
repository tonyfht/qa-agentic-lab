# Spec Delta — qa-agents

## ADDED Requirements

### Requirement: QA-047 Agente de API y barrido de contrato
El Agente de API SHALL diseñar pruebas de contrato y de negocio a partir del documento OpenAPI. Un barrido automático SHALL llamar a cada operación de lectura pública del contrato (sin parámetros obligatorios ni sesión) y validar su respuesta, de modo que una operación nueva quede cubierta sin escribir un test para ella.

#### Scenario: Barrido de contrato
- **WHEN** se ejecuta el barrido
- **THEN** cada operación GET pública sin parámetros obligatorios del OpenAPI se llama y su respuesta valida contra el contrato

#### Scenario: Operación que no cumple su contrato
- **GIVEN** una operación cuya respuesta no coincide con su esquema publicado
- **WHEN** se ejecuta el barrido
- **THEN** la prueba falla indicando la operación y el campo que no cumple
