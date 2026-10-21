# Spec Delta — quality-pipeline

## ADDED Requirements

### Requirement: QA-009 Calidad de especificaciones y escenarios
La etapa de análisis estático SHALL comprobar que cada requisito tiene identificador, lenguaje normativo (SHALL/MUST) y al menos dos escenarios, que la validación de OpenSpec pasa, y que cada escenario Gherkin lleva etiqueta de requisito existente, tipología y prioridad.

#### Scenario: Specs y escenarios correctos
- **WHEN** se ejecuta el análisis estático sobre el repositorio
- **THEN** la comprobación de specs y la de etiquetado Gherkin constan como superadas

#### Scenario: Escenario que cita un requisito inexistente
- **GIVEN** un escenario etiquetado `@CAT-099` y ese requisito no existe en ninguna spec
- **WHEN** se ejecuta el análisis estático
- **THEN** la comprobación de etiquetado falla indicando el fichero, el escenario y la etiqueta

## MODIFIED Requirements

### Requirement: QA-007 Nada se omite en silencio
Una etapa que no pueda ejecutarse en un entorno (por falta de un servicio o de un secreto) SHALL constar como omitida, con el motivo, en el resumen y en el resultado.

#### Scenario: Etapa sin requisito disponible
- **GIVEN** una etapa que necesita un secreto que no está configurado
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa consta como omitida con el motivo "falta <secreto>"
- **AND** la ejecución no la cuenta como superada

#### Scenario: Comprobación interna sin su herramienta
- **GIVEN** una comprobación de una etapa que necesita una herramienta no instalada (por ejemplo Gitleaks)
- **WHEN** se ejecuta la etapa
- **THEN** esa comprobación consta como omitida con el motivo y cómo instalar la herramienta, nunca como superada
