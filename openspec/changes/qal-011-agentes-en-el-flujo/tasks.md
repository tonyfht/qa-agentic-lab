# Tasks — QAL-011 Los agentes de QA, en el flujo

Rama: `change/qal-011-agentes-en-el-flujo`.

## 1. Registro

- [x] 1.1 `FLOW_STOPS` y campos `family`, `summary`, `forbidden`, `stops` y `sample` en los 11 agentes, validados
  en `checkAgentDefinitions`. Se verifica con pruebas unitarias (QA-057).

## 2. Informe

- [x] 2.1 `agentsFlow` en el modelo. Se verifica con pruebas unitarias del estado de paradas y actuaciones.
- [x] 2.2 Página `agentes.html` interactiva y botón en el informe. Se verifica con escenarios E2E y axe (QA-039).

## 3. Guía

- [x] 3.1 "Conoce a los agentes" en el README y paso de la ruta. Se verifica con la prueba de presentaciones
  (QA-056) y los comprobadores de enlaces.

## 4. Verificación

- [ ] 4.1 `npm run qa` en verde y pipeline del PR en verde. Se verifica con la ejecución.

## Testing

| Requisito | Prueba |
|---|---|
| QA-039 | `tests/features/quality/report.feature`, `tests/unit/report/model.test.ts` |
| QA-056 | `tests/unit/repo/readme.test.ts` |
| QA-057 | `tests/unit/qa/design-checks.test.ts` |

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-011-agentes-en-el-flujo`.
