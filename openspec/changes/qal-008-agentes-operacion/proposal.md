# QAL-008 — Agentes de operación

**Estado:** aprobado (mandato del fundador del 2026-10-21: ejecutar la hoja de ruta completa) · **Fecha:** 2026-10-21 ·
**Tipo:** operación de la suite + IA

## Why

Hasta ahora los agentes **construyen** la suite: revisan specs, escriben escenarios, automatizan y auditan. Falta
lo que pasa **después**, cuando la suite corre cada día y algo falla. En un equipo real, esa es la parte que más
tiempo consume:
- **¿Quién tiene la culpa?** Un fallo puede ser del producto (un defecto), del test (un selector que cambió), del
  entorno (un servicio caído, una herramienta que se cuelga) o simple inestabilidad.
- **Tests inestables** que pasan al reintentar y nadie mira hasta que la suite deja de ser creíble.
- **Tests rotos por cambios que no son funcionales**, que alguien "arregla" cambiando la aserción y escondiendo así
  un defecto.

Ya lo hemos vivido en este laboratorio:
- Lighthouse falló una vez con `NO_NAVSTART`, un error de la herramienta que pide "vuelve a ejecutarme".
- En Windows, dos tests de catálogo y carrito pasaron al reintentar porque el navegador tardó en cerrarse.

Ninguno era un defecto de la tienda, y hoy nada lo distingue.

## What Changes

- **Triaje** (determinista + agente). Cada test fallido o inestable recibe una categoría con su motivo:
  - `producto`: la tienda no hace lo que dice la spec;
  - `test`: el test no encuentra lo que busca;
  - `entorno`: un servicio no responde, o la herramienta o el navegador fallan;
  - `inestable`: pasó al reintentar.

  La categoría va en el resultado y en el informe. Cada fallo de producto genera un borrador de *issue* de defecto con
  su evidencia (`triaje.md`). El **agente de Triaje** revisa la clasificación y abre los *issues*.
- **Detector de inestables** (determinista + agente):
  - calcula sobre el histórico qué tests son inestables y con qué frecuencia;
  - el **agente** distingue inestabilidad del test frente a la del entorno y propone la corrección o la cuarentena.
- **Cuarentena con caducidad** (`qa/cuarentena.json`):
  - un test en cuarentena sigue ejecutándose y apareciendo en el informe, pero su fallo no bloquea;
  - cada entrada lleva motivo, *issue* y fecha de caducidad (14 días como máximo);
  - una entrada caducada bloquea el análisis estático, para que la cuarentena no se convierta en un cementerio.
- **Sanador** (agente + guardia determinista):
  - repara tests rotos por cambios no funcionales, usando el *healer* de Playwright Test Agents;
  - su PR pasa por una **guardia de aserciones**: puede cambiar localizadores y esperas, nunca una aserción, un
    `.feature` ni el código de la tienda. Así el principio 4 de `AGENTS.md` lo comprueba una máquina, no la buena
    voluntad.
- **Modo de inyección de defectos** para la demo: `npm run qa -- --inject <defecto>` o, en GitHub, el workflow con el
  defecto elegido. Hay tres defectos, uno por categoría de triaje:
  - `cupon`: los cupones distinguen mayúsculas (producto);
  - `selector`: cambia un identificador de la página sin cambiar el comportamiento (test);
  - `caida`: la API de artículos no está disponible (entorno).

  Solo actúa con la variable explícita y nunca en el despliegue. Una ejecución con defecto inyectado se marca así en
  el informe y nunca se publica en el histórico.
- **Reintento de herramientas:** un error propio de Lighthouse (como `NO_NAVSTART`) se reintenta una vez y queda
  marcado como inestable, no como fallo.
- **Informe:** dos secciones nuevas:
  - *¿Es estable la suite?*: tasa de inestables por ejecución, tests más inestables y cuarentena;
  - *¿Qué han reparado los agentes?*: triaje de la ejecución y actuaciones del Sanador y el Triaje.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `qa-agents`:
  - QA-050 Sanador con guardia de aserciones;
  - QA-051 Detector de inestables;
  - QA-052 Triaje de fallos.
- `quality-pipeline`:
  - QA-028 Cuarentena con caducidad;
  - QA-029 Inyección de defectos para la demo;
  - QA-035 Reintento ante errores de la herramienta.
- `quality-report`:
  - QA-053 ¿Es estable la suite?;
  - QA-054 ¿Qué han reparado los agentes?

## Valor para la demo

- **"Rompe la tienda en directo":** se inyecta un defecto, el pipeline se pone en rojo y el triaje dice de quién es la
  culpa antes de que nadie abra un log.
- **Auto-reparación con límites:** el Sanador arregla el selector, pero la guardia impide que "cure" un defecto
  cambiando la aserción. Se enseña el intento bloqueado.
- **La inestabilidad se mide:** un gráfico con la tasa por ejecución y una cuarentena que caduca.

## Testing scope

- **Tipologías:**
  - unitarias de las funciones puras: clasificador de triaje, estabilidad sobre el histórico, cuarentena, guardia
    de aserciones y catálogo de defectos;
  - E2E del informe (QA-053, QA-054);
  - E2E del modo de inyección: cada defecto produce la categoría esperada sobre mensajes reales capturados.
- **Riesgo:** medio. El clasificador es heurístico: se acota con mensajes reales de Playwright y, cuando duda, dice
  `desconocido` en lugar de adivinar. El agente revisa.

## Cumplimiento de los requisitos transversales

- **RT-2:** inyección, triaje y cuarentena funcionan igual en local y en CI.
- **RT-3:** categoría de triaje y estabilidad en el resultado y en el informe.
- **RT-4:** ruta de la visita con el paso "Rompe la tienda" y diagrama de agentes actualizado.
- **RT-5:** tres agentes nuevos con definición y primera actuación registrada.

## Fuera de alcance

- Abrir *issues* o PRs automáticamente sin la clave de la IA. Sin ella, el pipeline deja el borrador (`triaje.md`) y
  el agente se ejecuta desde Claude Code.
- Reintentos automáticos del pipeline completo.
- Aprendizaje del clasificador: es una tabla de reglas, revisable en un PR.

## Riesgos

- **El clasificador se equivoca** → cada categoría lleva el motivo (la regla que la decidió) y el agente de Triaje la
  revisa. Cuando duda, dice `desconocido`.
- **La cuarentena esconde defectos** → caduca en 14 días como máximo, exige *issue* y el informe la muestra siempre.
- **La inyección llega a producción** → solo actúa con `QA_INJECT_DEFECT` y nunca si existe `VERCEL`. Una ejecución
  inyectada no se publica.

## Criterios de éxito

1. Cada defecto inyectado produce en local y en CI la categoría de triaje esperada.
2. El informe responde *¿Es estable la suite?* y *¿Qué han reparado los agentes?* con datos reales.
3. La guardia bloquea un PR del Sanador que cambia una aserción y acepta uno que solo cambia un localizador.
4. Una cuarentena caducada bloquea el análisis estático.
5. El Sanador, el Detector de inestables y el Triaje tienen una actuación registrada cada uno.

## Impact

- **Lógica del sistema de calidad:** `qa/triage/`, `qa/stability/`, `qa/quarantine.ts`, `qa/healer/guard.ts`.
- **Inyección:** `lib/qa/defects.ts`, con puntos de inyección en el repositorio de cupones, el catálogo y la API de
  artículos.
- **Etapas:** `e2e` (cuarentena), `performance` (reintento), `static` (cuarentena caducada) y `governance` (guardia
  del Sanador).
- **Resto:** esquema de resultados (campos opcionales), informe, workflow (entrada `defecto`), tres definiciones de
  agente, README y AGENTS.md.
