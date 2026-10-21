# QAL-011 — Los agentes de QA, en el flujo

**Estado:** aprobado por el fundador (2026-10-21) · **Fecha:** 2026-10-21 · **Tipo:** guía + informe + IA

## Why

El laboratorio tiene **11 agentes de IA**, pero para conocerlos hay que leer once ficheros en `.claude/agents/` y
una tabla en `AGENTS.md` pensada para quien desarrolla. A quien visita el laboratorio le faltan dos cosas:
- **Quién es cada agente,** contado como una presentación: qué es, qué hace, cuándo actúa, qué tiene prohibido y un
  ejemplo real de su trabajo.
- **Dónde actúa cada uno en el flujo.** Hoy el informe dice cuántas veces ha actuado cada agente (*¿Qué ha hecho la
  IA?*), pero no **en qué parada del ciclo** interviene. La idea central del laboratorio, que la IA está en todo el
  ciclo y no solo en la automatización, no se ve de un vistazo.

## What Changes

### README: "Conoce a los agentes"

Una sección nueva con una presentación por agente, en el orden del ciclo:
- **Requisitos:** Revisor de specs.
- **Diseño:** Analista, Diseñador de casos.
- **Automatización:** Automatizador, Agente de API.
- **No funcional:** Auditor de experiencia, Auditor de seguridad y cumplimiento.
- **Operación:** Triaje, Sanador, Detector de inestables.
- **Salida:** Reportero.

Cada presentación tiene:
- quién es, en una frase;
- qué hace;
- en qué paradas del flujo interviene;
- qué tiene prohibido;
- un enlace a una muestra real de su trabajo (su revisión o su PR);
- un enlace a su definición.

Una prueba comprueba que el README presenta a todos los agentes del registro, para que ninguno nuevo se quede fuera.

### Informe: botón "Agentes de QA en este flujo"

En la cabecera del informe, junto al tema, un botón que abre una segunda página, `agentes.html`, en otra pestaña.
La página, con la dirección visual de la maqueta del 2026-10-21:
- **La línea del flujo,** con sus paradas:
  - especificación, diseño y automatización;
  - las siete etapas del pipeline de GitHub Actions, agrupadas en un marco;
  - "tras un fallo".

  Cada parada muestra su estado en la ejecución del informe (verde, rojo, omitida).
- **Una calle por agente** con un color propio por familia: un trazo une las paradas en las que interviene.
- **Selección:** al elegir un agente (en su chip o en su calle), el resto se atenúa y su trazo y sus paradas se
  iluminan con su color, con líneas que bajan de la parada a su calle. Una ficha muestra qué es, qué hace, dónde
  interviene, qué tiene prohibido, cuántas actuaciones lleva y la última, con enlace.
- **Animación suave:** el trazo se dibuja al elegirlo. Se desactiva con `prefers-reduced-motion`.
- **Uso con teclado y lector:** los chips son botones con `aria-pressed`, y hay una tabla alternativa (agente ×
  parada), como en el resto de gráficos del informe.
- **Pantallas estrechas:** la línea pasa a vertical.
- **Sin dependencias:** igual que el informe (SVG y JS propios, sin red), funciona abierta desde disco, con
  `npm run report` y en GitHub Pages.

### Una sola fuente de verdad

El registro de agentes (`qa/agents/registry.ts`) gana, por agente:
- `summary` (qué hace);
- `stops` (paradas en las que interviene);
- `family` (color).

Lo usan el informe, la página nueva y la prueba del README, de modo que la página no se puede desincronizar del
registro.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `quality-report`: QA-039, agentes en el flujo (botón y página).
- `lab-guide`: QA-056, presentación de los agentes en el README.
- `qa-agents`: QA-057, cada agente declara qué hace y en qué paradas interviene.

## Valor para la demo

- **"Aquí está la IA" en una imagen:** la línea del ciclo con once agentes encima. Se elige uno y se ve su recorrido.
- **Presentaciones que se pueden leer en voz alta** delante de un cliente, una por agente, con un ejemplo real.
- **Cuenta lo que pasó en esa ejecución:** paradas en verde o en rojo, y actuaciones reales del registro.

## Testing scope

- **Unitarias:** paradas válidas y sin repetir por agente; cada agente con `summary` y `family`; el README presenta
  a todos los agentes del registro.
- **E2E del informe:**
  - el botón abre la página;
  - elegir un agente marca sus paradas y atenúa el resto;
  - la tabla alternativa lista a todos;
  - la página se ve en vertical a 390 px.
- **Accesibilidad:** axe sin violaciones graves en la página nueva.
- **Riesgo:** bajo. Es presentación de datos que ya existen.

## Cumplimiento de los requisitos transversales

- **RT-3:** los datos salen del registro y de la ejecución.
- **RT-4:** README y ruta de la visita actualizados.
- **RT-5:** los agentes, presentados donde se ven.

## Fuera de alcance

- Ejecutar agentes desde la página: solo informa.
- Métricas de coste o tokens de los agentes.

## Riesgos

- **Que la página se vea recargada con 11 calles** → colores por familia (5) y no por agente, y solo se resalta uno
  cada vez.
- **Rendimiento del informe** → la página nueva es independiente y no carga ECharts.

## Criterios de éxito

1. El README presenta a los 11 agentes, en el orden del ciclo, con un ejemplo real de cada uno.
2. El informe tiene el botón y la página interactiva, en local y en GitHub Pages.
3. Elegir un agente resalta exactamente las paradas que declara el registro.
4. La página pasa axe y se usa con teclado.

## Impact

`qa/agents/registry.ts`, `report/model.ts`, `report/build.ts`, `report/template/{index.html,agentes.html,agentes.js,
report.css}`, `README.md`, pruebas unitarias y E2E del informe.
