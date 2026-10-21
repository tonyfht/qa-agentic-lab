# QAL-009 — Informe completo

**Estado:** aprobado (mandato del fundador del 2026-10-21: ejecutar la hoja de ruta completa) · **Fecha:** 2026-10-21 ·
**Tipo:** informe + IA + guía

## Why

El informe ya responde a muchas preguntas: tendencia, tiempo, cobertura, trazabilidad, experiencia, seguridad,
estabilidad y agentes. Pero no responde a **la que hace quien decide: ¿podemos salir a producción?**

Hoy, para saberlo, hay que leer ocho secciones y juntar las piezas mentalmente. A un cliente, a un responsable de
producto o a alguien que empieza en QA hay que darle:
- **la respuesta arriba y en una frase**, con los motivos;
- **la comparación con la ejecución anterior**: ¿hemos ido a mejor?;
- **una lectura en lenguaje de negocio**, que es lo que aporta un agente, sin que el agente decida.

Además falta un gráfico que pide cualquier revisión: **cobertura por capacidad** (catálogo, carrito, pagos...). La
cobertura global de "88 / 94" no dice *dónde* están los huecos.

Y la guía tiene que contar el laboratorio completo: el README sigue diciendo "estado: en construcción" y la hoja de
ruta no marca lo hecho.

## What Changes

- **Recomendación de salida determinista** (`releaseVerdict`), con una de tres respuestas y siempre con sus motivos:
  - **"Sí, se puede salir"**;
  - **"Salir con reservas"**: tests inestables, requisitos sin probar, rendimiento que empeora o cobertura que baja;
  - **"No salir"**: una etapa bloqueante fallida o sin ejecutar, un requisito que falla, hallazgos de seguridad
    bloqueantes o una ejecución con defecto inyectado.

  La decide el código, nunca la IA (principio 2 de `AGENTS.md`).
- **Resumen ejecutivo** al principio del informe (*¿Podemos salir?*):
  - el veredicto y sus motivos;
  - la comparación con la ejecución anterior en tests, cobertura, hallazgos y duración;
  - la última lectura del **Reportero**, con su fecha.

  El veredicto también va al resumen del *job* en GitHub Actions.
- **Reportero** (`qa-reportero`): agente que compara con el histórico y redacta el resumen ejecutivo para negocio.
  Puede discrepar del veredicto y argumentarlo, pero no cambiarlo.
- **Gráfico "¿Dónde están los huecos?":** requisitos por capacidad y estado.
- **Fuera "Lo que irá apareciendo":** ya no queda nada por llegar.
- **Guía final:**
  - README con el estado completo y un paso de la ruta para *¿Podemos salir?*;
  - el Reportero en el diagrama de agentes;
  - la hoja de ruta de `PROJECT.md` marcada como hecha;
  - `AGENTS.md` al día.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `quality-report`:
  - QA-036 ¿Podemos salir?;
  - QA-037 Resumen ejecutivo;
  - QA-038 ¿Dónde están los huecos?
- `qa-agents`: QA-055 Reportero.

## Valor para la demo

- **Una pregunta, una respuesta, sus motivos:** lo primero que ve un cliente al abrir el informe.
- **IA que explica sin decidir:** el veredicto es una regla que se puede leer; el Reportero lo cuenta en lenguaje de
  negocio y lo compara con el histórico.
- **Laboratorio cerrado:** la ruta de la visita recorre el ciclo completo, de la especificación a la recomendación de
  salida.

## Testing scope

- **Tipologías:**
  - unitarias de `releaseVerdict` y de la cobertura por capacidad, con una tabla de decisión: cada regla y su
    combinación;
  - E2E del informe (QA-036…038);
  - comprobación de la definición del Reportero (QA-055).
- **Riesgo:** bajo. Es lectura de datos que ya existen.

## Cumplimiento de los requisitos transversales

- **RT-3:** el veredicto sale del resultado de la ejecución, en local y en CI.
- **RT-4:** ruta, diagrama y estado del README actualizados.
- **RT-5:** el Reportero, con su primera actuación.

## Fuera de alcance

- Desplegar automáticamente según el veredicto: el laboratorio no tiene despliegue continuo.
- Firmar o aprobar una salida: la decisión es de una persona; el informe la informa.

## Riesgos

- **Que el veredicto parezca la decisión** → el texto dice "recomendación" y lista los motivos. La decisión de salir
  es de una persona.
- **Que la lectura del Reportero se quede antigua** → se muestra con la fecha y la ejecución a la que se refiere.

## Criterios de éxito

1. El informe abre con *¿Podemos salir?* y un veredicto con motivos, igual en local y en GitHub Pages.
2. Cada regla del veredicto tiene una prueba.
3. El gráfico de cobertura por capacidad muestra dónde faltan pruebas.
4. El Reportero tiene definición y una actuación registrada.
5. El README cuenta el laboratorio completo y la ruta llega hasta la recomendación de salida.

## Impact

`report/verdict.ts` (nuevo), `report/model.ts`, plantilla del informe, `qa/stages/report.ts` (veredicto en el
resumen), `.claude/agents/qa-reportero.md`, `qa/agents/registry.ts`, README, AGENTS.md, `openspec/PROJECT.md`.
