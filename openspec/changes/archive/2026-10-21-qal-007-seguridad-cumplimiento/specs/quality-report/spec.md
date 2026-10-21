# Spec Delta — quality-report

## ADDED Requirements

### Requirement: QA-026 Es segura y cumple
El informe SHALL responder a "¿Es segura y cumple?" con los hallazgos por gravedad y por fuente, las excepciones aceptadas con su motivo, el número de componentes del SBOM y el estado de licencias. Sin hallazgos registrados SHALL explicar si la etapa no se ejecutó.

#### Scenario: Con hallazgos
- **GIVEN** una ejecución con hallazgos de varias fuentes
- **WHEN** se abre el informe
- **THEN** la sección muestra los hallazgos por gravedad y fuente y las excepciones con su motivo

#### Scenario: Etapa no ejecutada
- **GIVEN** una ejecución sin la etapa de seguridad
- **WHEN** se abre el informe
- **THEN** la sección explica que no hay resultados de seguridad en esta ejecución
