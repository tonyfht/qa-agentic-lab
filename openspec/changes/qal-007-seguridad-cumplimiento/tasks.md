# Tasks — QAL-007 Seguridad y cumplimiento

Rama: `change/qal-007-seguridad-cumplimiento`.

## 1. Producto

- [ ] 1.1 Cabeceras de seguridad en `next.config.ts`. Se verifica con los escenarios `@security` de SEC-001.
- [ ] 1.2 Página `/privacidad` y pie de página. Se verifica con los escenarios de CMP-003.

## 2. Hallazgos y comprobaciones

- [ ] 2.1 Esquema `Finding` y `blockingFindings()` puro. Se verifica con pruebas unitarias de la regla de bloqueo.
- [ ] 2.2 Normalizadores de Semgrep, npm audit y ZAP, y política de licencias, puros. Se verifica con pruebas
  unitarias sobre salidas reales recortadas (SEC-002…004, CMP-001).
- [ ] 2.3 Ejecutores (Semgrep, npm audit, licencias, SBOM y ZAP) con omisión explicada. Se verifica con la etapa en
  local (Semgrep y ZAP omitidos en Windows sin Docker) y en CI.

## 3. Etapa y CI

- [ ] 3.1 Etapa `security` y su registro tras `performance`. Se verifica con `npm run qa -- --stage security`.
- [ ] 3.2 *Job* "5 · Seguridad y cumplimiento", renumeración, artefacto SBOM, checks obligatorios y diagrama. Se
  verifica con las pruebas de configuración y la ejecución del PR.

## 4. Informe y agente

- [ ] 4.1 Sección "¿Es segura y cumple?". Se verifica con escenarios E2E del informe (QA-026).
- [ ] 4.2 Auditor de seguridad y cumplimiento con su primera auditoría registrada sobre la ejecución de CI. Se
  verifica con las comprobaciones de agentes (QA-049).

## 5. Guía

- [ ] 5.1 README (paso de la ruta y requisitos opcionales) y AGENTS.md. Se verifica con los comprobadores de enlaces.

## 6. Verificación

- [ ] 6.1 Pipeline en verde en el PR, con hallazgos reales de CI en el informe. Se verifica con la ejecución del PR.

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-007-seguridad-cumplimiento`.
