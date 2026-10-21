# Spec Delta — quality-pipeline

## ADDED Requirements

### Requirement: QA-027 Etapa de seguridad y cumplimiento
El pipeline SHALL tener una etapa bloqueante de seguridad y cumplimiento que ejecuta SAST, auditoría de dependencias, licencias, SBOM y DAST pasivo con el mismo comando en local y en CI, y SHALL dejar los hallazgos normalizados en el resultado de la ejecución.

#### Scenario: Etapa en CI
- **WHEN** se ejecuta el pipeline en GitHub Actions
- **THEN** la etapa "Seguridad y cumplimiento" aparece como paso propio y el SBOM queda como artefacto de la ejecución

#### Scenario: Hallazgo bloqueante
- **GIVEN** un hallazgo alto sin aceptar
- **WHEN** se ejecuta la etapa
- **THEN** la etapa falla y la ejecución queda en rojo
