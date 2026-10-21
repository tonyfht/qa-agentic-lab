# Tasks — QAL-006 Experiencia

Rama: `change/qal-006-experiencia`.

## 1. Accesibilidad y teclado

- [x] 1.1 Escenarios `@a11y` con axe sobre las páginas clave (incluidos carrito y checkout con contenido). Se verifica
  con la etapa E2E en verde (EXP-001).
- [x] 1.2 Estilo global `:focus-visible` y escenario de teclado. Se verifica con el escenario de EXP-002 en verde.

## 2. Regresión visual

- [x] 2.1 `snapshotPathTemplate` por plataforma, escenarios `@visual` y omisión con motivo sin referencias. Se verifica
  con el escenario omitido en local y una prueba del *step* (EXP-003).
- [x] 2.2 Workflow `visual-baselines.yml` que genera las referencias en Linux y las sube como artefacto. Se verifica con
  una ejecución en GitHub tras fusionar y el PR de referencias.

## 3. Rendimiento y carga

- [x] 3.1 `qa/lib/budgets.ts` puro (presupuestos de Lighthouse y umbrales de carga). Se verifica con pruebas unitarias
  de valores límite (EXP-004, EXP-005).
- [x] 3.2 Etapa `performance` (Lighthouse por CLI y k6 si está instalado) con métricas en el parcial y en el resultado.
  Se verifica con `npm run qa -- --stage performance` en verde y con k6 omitido con motivo en local (QA-019).
- [x] 3.3 Script de carga `tests/load/tienda.js`. Se verifica con su ejecución en CI.
- [x] 3.4 *Job* de CI, renumeración de etapas, checks obligatorios y diagrama del README. Se verifica con las pruebas de
  configuración del repositorio y la ejecución del PR.

## 4. Informe y agente

- [x] 4.1 Sección "¿Es usable y rápida?" con gráficos, tabla y estado vacío. Se verifica con escenarios E2E del informe
  (QA-018).
- [x] 4.2 Auditor de experiencia (definición, alta en el registro, primera auditoría registrada). Se verifica con las
  comprobaciones de agentes (QA-048).

## 5. Guía

- [x] 5.1 README: paso de la ruta (calidad no funcional) y requisitos opcionales (k6). Se verifica con el comprobador de
  enlaces en verde.

## 6. Verificación

- [x] 6.1 Pipeline en verde en local y en el PR, con métricas reales en el informe. Se verifica con la ejecución del PR.

## Workflow follow-up

- Fusionar sin *squash*, generar las referencias visuales en CI, incorporarlas por PR y archivar con
  `/opsx:archive qal-006-experiencia`.
