# Tasks — QAL-009 Informe completo

Rama: `change/qal-009-informe-completo`.

## 1. Recomendación y modelo

- [x] 1.1 `releaseVerdict` con la tabla de reglas. Se verifica con pruebas unitarias de cada regla y su combinación
  (QA-036).
- [x] 1.2 `executive` y `coverageByCapability` en el modelo del informe. Se verifica con pruebas unitarias (QA-037,
  QA-038).

## 2. Informe

- [x] 2.1 Sección "¿Podemos salir?" arriba, gráfico "¿Dónde están los huecos?" y retirada de "Lo que irá
  apareciendo". Se verifica con escenarios E2E del informe.
- [x] 2.2 Veredicto y motivos en el resumen del *job*. Se verifica con prueba unitaria del texto del resumen.

## 3. Reportero

- [x] 3.1 Definición, registro y `agents.yml`. Se verifica con las comprobaciones de agentes (QA-055).
- [x] 3.2 Primera lectura del Reportero sobre una ejecución real. Se verifica con las comprobaciones del registro.

## 4. Guía

- [x] 4.1 README final (estado, paso de la ruta, diagrama), `PROJECT.md` y `AGENTS.md`. Se verifica con los
  comprobadores de enlaces y Mermaid.

## 5. Verificación

- [x] 5.1 Pipeline en verde en el PR y el informe publicado con el veredicto tras fusionar. Se verifica con la
  ejecución de Actions y GitHub Pages.

## Testing

| Requisito | Prueba |
|---|---|
| QA-036 | `tests/unit/report/verdict.test.ts` y `tests/features/quality/report.feature` |
| QA-037 | `tests/unit/report/verdict.test.ts` (resumen del *job*) y `tests/features/quality/report.feature` |
| QA-038 | `tests/unit/report/model.test.ts` y `tests/features/quality/report.feature` |
| QA-055 | `tests/unit/qa/design-checks.test.ts` |

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-009-informe-completo`.
