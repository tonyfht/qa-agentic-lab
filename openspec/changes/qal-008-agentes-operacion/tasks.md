# Tasks — QAL-008 Agentes de operación

Rama: `change/qal-008-agentes-operacion`.

## 1. Inyección de defectos

- [x] 1.1 Catálogo `lib/qa/defects.ts` y puntos de inyección (`cupon`, `selector`, `caida`). Se verifica con pruebas
  unitarias de `activeDefect` (sin variable, con `VERCEL`, defecto desconocido).
- [x] 1.2 `--inject` en el orquestador, `injectedDefect` en el resultado y esquema regenerado. Se verifica con
  `npm run qa -- --stage e2e --inject <defecto>` para los tres defectos.

## 2. Triaje, estabilidad y cuarentena

- [x] 2.1 `classifyFailure` con mensajes reales de cada defecto y de los inestables conocidos. Se verifica con pruebas
  unitarias (QA-052).
- [x] 2.2 Triaje en el resultado y `triaje.md` con borradores de *issue*. Se verifica con pruebas unitarias del
  borrador y con la ejecución inyectada.
- [x] 2.3 `stability()` sobre el histórico. Se verifica con pruebas unitarias (QA-051).
- [x] 2.4 Cuarentena: comprobación en `static` y no bloqueo en `e2e`. Se verifica con pruebas unitarias (QA-028).
- [x] 2.5 Reintento de Lighthouse ante errores de la herramienta. Se verifica con pruebas unitarias de la decisión
  (QA-035).

## 3. Sanador

- [x] 3.1 `checkHealerDiff` y su uso en `governance`, con `fetch-depth: 0`. Se verifica con pruebas unitarias sobre
  diffs reales: localizador permitido, aserción, `.feature` y tienda bloqueados (QA-050).

## 4. Informe, agentes y CI

- [x] 4.1 Secciones "¿Es estable la suite?" y "¿Qué han reparado los agentes?", y aviso de defecto inyectado. Se
  verifica con escenarios E2E del informe (QA-053, QA-054).
- [x] 4.2 Definiciones de Sanador, Detector de inestables y Triaje, registro y `agents.yml`. Se verifica con las
  comprobaciones de agentes.
- [x] 4.3 Entrada `defecto` en el workflow; sin publicación si hay defecto. Se verifica con las pruebas de
  configuración del workflow.
- [x] 4.4 Primera actuación de cada agente: triaje de los tres defectos, estabilidad del histórico y una reparación
  del Sanador comprobada por la guardia. Se verifica con las comprobaciones del registro.

## 5. Guía

- [x] 5.1 README (paso "Rompe la tienda" y diagrama de agentes) y AGENTS.md. Se verifica con los comprobadores de
  enlaces y Mermaid.

## 6. Verificación

- [ ] 6.1 Pipeline en verde en el PR, y una ejecución en GitHub con defecto inyectado y su triaje. Se verifica con las
  ejecuciones de Actions.

## Testing

| Requisito | Prueba |
|---|---|
| QA-028 | `tests/unit/qa/quarantine.test.ts` |
| QA-029 | `tests/unit/lib/defects.test.ts` y `tests/unit/qa/run-args.test.ts` |
| QA-035 | `tests/unit/qa/lighthouse-retry.test.ts` |
| QA-050 | `tests/unit/qa/healer-guard.test.ts` |
| QA-051 | `tests/unit/qa/stability.test.ts` |
| QA-052 | `tests/unit/qa/triage.test.ts` |
| QA-053, QA-054 | `tests/features/quality/report.feature` |

## Workflow follow-up

- Fusionar sin *squash* y archivar con `/opsx:archive qal-008-agentes-operacion`.
