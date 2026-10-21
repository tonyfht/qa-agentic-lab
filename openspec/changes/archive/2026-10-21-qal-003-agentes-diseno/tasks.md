# Tasks — QAL-003 Agentes de diseño

Rama: `change/qal-003-agentes-diseno`.

## 1. Agentes

- [x] 1.1 Playwright Test Agents (`init-agents --loop=claude`), `.mcp.json` multiplataforma y semilla en
  `tests/agents/`. Se verifica con los ficheros presentes y `npx playwright run-test-mcp-server --help` disponible.
- [x] 1.2 Cuatro agentes `qa-revisor-specs`, `qa-analista`, `qa-disenador` y `qa-automatizador` con las seis secciones.
  Se verifica con la comprobación de definición de agentes en verde.

## 2. Comprobaciones deterministas

- [x] 2.1 Parser mínimo de Gherkin y comprobación de etiquetado (requisito existente, tipología, prioridad, técnica en
  los *outlines*). Se verifica con pruebas unitarias de casos válidos e inválidos (QA-009, QA-043).
- [x] 2.2 Comprobación de calidad de specs (ID, SHALL/MUST, ≥2 escenarios y `openspec validate`) con `openspec` como
  dependencia de desarrollo. Se verifica con pruebas unitarias (QA-009).
- [x] 2.3 Comprobación de definición de agentes (QA-040) y del registro (QA-045). Se verifica con pruebas unitarias.
- [x] 2.4 Etiquetar las `Scenario Outline` existentes con su técnica. Se verifica con la etapa `static` en verde.

## 3. Registro e informe

- [x] 3.1 Esquema `AgentAction`, lectura de `qa/agents/actions.ndjson` y su paso a `agentActions` en el resultado. Se
  verifica con pruebas unitarias del ensamblado y el JSON Schema regenerado.
- [x] 3.2 Sección "¿Qué ha hecho la IA?" con gráfico, lista, tabla y estado vacío. Se verifica con escenarios E2E del
  informe (QA-017).

## 4. Ejecución en GitHub

- [x] 4.1 `agents.yml` con omisión explícita sin clave. Se verifica con una prueba de configuración y una ejecución
  manual en GitHub tras fusionar (QA-046).

## 5. Primera actuación real

- [x] 5.1 Revisión de la spec del catálogo (`qa/agents/reviews/catalog.md`) registrada. Se verifica con el registro
  válido.
- [x] 5.2 Escenarios *pairwise* de combinaciones de filtros y su *step* genérico, registrados. Se verifica con la etapa
  E2E en verde.

## 6. Guía

- [x] 6.1 README: sección de agentes con diagrama de arquitectura y paso en la ruta. AGENTS.md: tabla de agentes al
  día. Se verifica con los comprobadores de enlaces y Mermaid en verde.

## 7. Verificación

- [x] 7.1 Pipeline en verde en local y en el PR. Se verifica con la ejecución del PR.

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-003-agentes-diseno`.
