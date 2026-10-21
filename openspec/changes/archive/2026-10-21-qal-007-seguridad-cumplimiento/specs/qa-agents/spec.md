# Spec Delta — qa-agents

## ADDED Requirements

### Requirement: QA-049 Auditor de seguridad y cumplimiento
El Auditor de seguridad y cumplimiento SHALL priorizar los hallazgos de una ejecución por riesgo real para el negocio, revisar que cada excepción aceptada siga justificada y proponer correcciones, sin aceptar hallazgos nuevos ni modificar reglas por su cuenta.

#### Scenario: Auditoría de hallazgos
- **WHEN** el Auditor revisa los hallazgos de una ejecución
- **THEN** deja un informe con cada hallazgo priorizado, su riesgo explicado y una propuesta

#### Scenario: El Auditor no acepta riesgos
- **GIVEN** un hallazgo medio sin aceptar
- **WHEN** el Auditor lo revisa
- **THEN** propone la corrección o una excepción para que una persona la apruebe, sin añadirla él
