# QAL-003 — Agentes de diseño de pruebas

**Estado:** aprobado (mandato del fundador del 2026-10-21: ejecutar la hoja de ruta completa) · **Fecha:** 2026-10-21 ·
**Tipo:** calidad + IA

## Why

El laboratorio promete "QA apoyada en IA en todo el ciclo" (RT-5), y hasta ahora todas las pruebas las ha diseñado
una persona. Este cambio incorpora los primeros agentes, los que trabajan **antes** de ejecutar:
- revisar los requisitos;
- convertirlos en escenarios;
- aplicar técnicas de diseño;
- automatizarlos.

Lo hace con dos garantías que hacen que la IA sea gobernable:
- **reglas deterministas** que comprueban su trabajo;
- **un registro** de todo lo que hacen, visible en el informe.

## What Changes

- **Cuatro agentes de diseño**, definidos como subagentes de Claude Code versionados en `.claude/agents/`, cada uno
  con su función, entradas, salidas, herramientas y **lo que tiene prohibido**:
  - **Revisor de specs:** detecta ambigüedad, requisitos que no se pueden comprobar y escenarios de error que faltan.
  - **Analista:** explora la tienda con el MCP de Playwright y convierte los requisitos en `.feature` etiquetados.
  - **Diseñador de casos:** aplica técnicas de diseño (valores límite, clases de equivalencia, tablas de decisión,
    *pairwise*) y deja la técnica etiquetada.
  - **Automatizador:** implementa los *steps* y solo entrega lo que pasa.
- **Playwright Test Agents** (planner, generator y healer, de `npx playwright init-agents`) como herramientas de base,
  con su servidor MCP en `.mcp.json`.
- **Comprobaciones deterministas del trabajo de diseño** en la etapa `static`:
  - **calidad de las specs:** cada requisito lleva ID, lenguaje normativo y al menos dos escenarios, y `openspec
    validate` pasa;
  - **etiquetado del Gherkin:** cada escenario lleva requisito, tipología y prioridad, y cada `Scenario Outline` declara
    su técnica de diseño.
- **Registro de actuaciones de los agentes** (`qa/agents/actions.ndjson`), validado con un esquema e incorporado al
  resultado de cada ejecución (`agentActions`).
- **Informe:** nueva pregunta *¿Qué ha hecho la IA?*, con las actuaciones por agente y las últimas realizadas.
- **Ejecución en GitHub bajo demanda** (`agents.yml`, lanzamiento manual): ejecuta un agente sobre un cambio con la
  GitHub Action de Claude Code y abre un PR. Sin `ANTHROPIC_API_KEY` se omite con el motivo, nunca en silencio.
- **Primera actuación real:** el Revisor revisa la spec del catálogo y el Diseñador añade al catálogo combinaciones
  *pairwise* de filtros. Las dos quedan registradas.
- **README:** sección de los agentes con un diagrama de su arquitectura y un paso nuevo en la ruta.

## Capabilities

### New Capabilities

- `qa-agents`: definición, límites, registro y ejecución de los agentes de QA (IDs `QA-04x`).

### Modified Capabilities

- `quality-pipeline`: se añade QA-009 (calidad de specs y Gherkin en el análisis estático).
- `quality-report`: se añade QA-017 (¿Qué ha hecho la IA?).

## Valor para la demo

- **En directo:** se le pide al Analista que convierta un requisito en Gherkin y al Diseñador que aplique *pairwise*.
  El resultado llega por PR.
- **Gobierno:** el pipeline rechaza un `.feature` sin etiquetas aunque lo haya escrito una IA. La IA propone y las
  reglas deciden.
- **Informe:** el cliente ve cuántas actuaciones ha hecho cada agente y qué ha producido.

## Testing scope

- **Tipologías:** unitarias (comprobadores de specs y Gherkin, esquema del registro), E2E del informe (nueva
  pregunta), estática (los comprobadores corren sobre el propio repositorio).
- **Riesgo:** medio. Los comprobadores pueden frenar trabajo legítimo si son demasiado estrictos; nacen con lo que ya
  cumple el repositorio.

## Cumplimiento de los requisitos transversales

- **RT-2:** los comprobadores corren igual en local y en CI. Los agentes en CI necesitan clave y, si falta, se omiten
  con motivo.
- **RT-3:** las actuaciones llegan al resultado y al informe.
- **RT-4:** el README explica los agentes con un diagrama.
- **RT-5:** primera pieza de IA real del ciclo.

## Fuera de alcance

- Agentes de operación (Sanador, Triaje, *flaky*): QAL-008.
- Agente de API: QAL-005.
- Configurar `ANTHROPIC_API_KEY` en el repositorio: es decisión y cuenta del fundador.

## Riesgos

- **Coste:** los agentes en CI solo corren a mano y con clave.
- **Agentes que "inventan":** cada agente tiene prohibido cambiar specs o aserciones existentes sin PR, y su trabajo
  pasa por los mismos comprobadores que el de una persona.

## Criterios de éxito

1. Cuatro agentes propios en `.claude/agents/` con función, entradas, salidas y prohibiciones, comprobados por una
   prueba.
2. La etapa `static` rechaza un requisito sin escenario de error o un escenario sin etiqueta de requisito.
3. El registro de actuaciones valida contra su esquema y sus entradas aparecen en el informe bajo *¿Qué ha hecho la IA?*
4. El workflow de agentes se omite con motivo explícito si no hay clave.
5. Hay al menos dos actuaciones reales registradas (revisión de la spec del catálogo y escenarios *pairwise*).

## Impact

`.claude/agents/`, `.mcp.json`, `qa/agents/`, `qa/checks/`, `report/`, `.github/workflows/agents.yml`, README.
