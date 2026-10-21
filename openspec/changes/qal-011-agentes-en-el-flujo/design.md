# Design — QAL-011 Los agentes de QA, en el flujo

## Context

Ver `proposal.md` y los requisitos:
- QA-039 (página del informe);
- QA-056 (README);
- QA-057 (registro).

La dirección visual es la maqueta interactiva aprobada el 2026-10-21: línea de paradas, calles por agente, chips y
ficha.

## Goals / Non-Goals

**Goals:**
- Un registro que es la única fuente de los datos de cada agente.
- Una página interactiva sin dependencias.
- Presentaciones en el README que una prueba mantiene completas.

**Non-Goals:** ejecutar agentes desde la página; costes o tokens.

## Decisions

### 1. Registro (`qa/agents/registry.ts`)

```ts
export const FLOW_STOPS = [
  { id: 'spec', short: 'Spec', name: 'Requisitos' },
  { id: 'design', short: 'Diseño', name: 'Gherkin y casos' },
  { id: 'automation', short: 'Autom.', name: 'Automatización' },
  { id: 'static', short: '1', name: 'Estático', stage: 'static' }, …, { id: 'publish', short: '7', name: 'Publicar' },
  { id: 'failure', short: '!', name: 'Tras un fallo' },
]
```

Las paradas del pipeline llevan `stage` (el id de la etapa) para pintar su estado.

**Cada agente gana:**
- `family`: `diseno`, `automatizacion`, `auditoria`, `operacion` o `salida`;
- `summary`: qué hace, en una frase;
- `forbidden`: lo que no puede hacer, en una frase;
- `stops`: los ids de parada;
- `sample`: la ruta a una muestra real de su trabajo.

`checkAgentDefinitions` (QA-040, etapa `static`) añade la validación de QA-057.

| Agente | Familia | Paradas |
|---|---|---|
| Revisor de specs | diseño | spec |
| Analista | diseño | spec, design |
| Diseñador de casos | diseño | design |
| Automatizador | automatización | automation, e2e |
| Agente de API | automatización | automation, e2e |
| Auditor de experiencia | auditoría | e2e, performance |
| Auditor de seguridad y cumplimiento | auditoría | security |
| Triaje | operación | report, failure |
| Sanador | operación | failure, static (su PR pasa la guardia de gobierno y el estático) |
| Detector de inestables | operación | report, failure |
| Reportero | salida | report, publish |

**Colores por familia** (5), con tokens del informe en claro y en oscuro:
- diseño: violeta;
- automatización: verde azulado;
- auditoría: coral;
- operación: ámbar;
- salida: azul.

### 2. Modelo (`model.agentsFlow`)

- `stops`: las paradas con el estado de la etapa en esta ejecución (`passed`, `failed`, `skipped`, `not_run`), o
  `null` fuera del pipeline.
- `agents`: id, nombre, familia, resumen, prohibido, paradas, enlaces a la definición y a la muestra, número de
  actuaciones y la última.

`build.ts` copia `agentes.html` y `agentes.js` y reutiliza `data.js` y `report.css`.

### 3. Página `agentes.html` + `assets/agentes.js`

- **Estructura:**
  - cabecera con logo y "Volver al informe";
  - chips: "Todos" y uno por agente, como botones con `aria-pressed`;
  - SVG con la línea y las calles;
  - ficha;
  - `<details>` con la tabla alternativa.
- **SVG generado en JS,** con el `viewBox` calculado:
  - en horizontal si el ancho es de 760 px o más;
  - en vertical (paradas en columna y calles en columnas) por debajo.
- **Paradas:** círculo con su número y nombre; el borde indica el estado (verde, rojo o gris, con icono en el texto
  para no depender del color); un marco discontinuo agrupa el pipeline de GitHub Actions.
- **Selección:**
  - las calles de los demás se atenúan (`opacity`);
  - las paradas del agente se rellenan con su color;
  - líneas discontinuas bajan de la parada a la calle;
  - el trazo se anima con `stroke-dasharray` y se desactiva con `prefers-reduced-motion`;
  - la calle también es pulsable y enfocable (`tabindex=0`, Enter o espacio).
- **Estado en la URL** (`#agente=triaje`): se puede enlazar a un agente concreto.

### 4. Botón en el informe

En `run-meta`, junto a "Cambiar tema", un enlace (no un botón, porque navega) con aspecto de botón, que abre la
página de agentes en otra pestaña (`target="_blank"`, `rel="noopener"`, `data-testid="agents-flow-link"`).

### 5. README

Sección "Conoce a los agentes", tras "Cómo funciona":
- una presentación por agente (`### 🔎 Revisor de specs` …), con quién es, qué hace, dónde interviene, qué no puede
  hacer, muestra y definición;
- un enlace a la página interactiva del informe publicado;
- un paso en la ruta de la visita.

## Gherkin

```gherkin
@e2e @p2 @QA-039
Scenario: Elegir un agente resalta sus paradas
```

## Risks / Trade-offs

- **[El SVG con 11 calles en el móvil]** → se pinta en vertical: las paradas en columna y una columna estrecha por
  agente; la ficha va debajo.
- **[El SVG interactivo y la accesibilidad]** → axe detectó en la primera versión dos fallos graves:
  - un SVG con `role="img"` que contenía elementos interactivos;
  - botones cuyo nombre accesible no incluía el texto visible.

  El SVG pasa a `role="group"` con título y descripción, y cada calle se llama «N. Nombre: ver su flujo».
- **[El texto del registro y el del README se separan]** → el README es prosa para personas (más rico); la prueba solo
  exige que cada agente esté presentado y enlazado.

## Migration Plan

Ninguna.
