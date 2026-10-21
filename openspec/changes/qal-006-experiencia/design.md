# Design — QAL-006 Experiencia

## Context

Ver `proposal.md` y la spec `experience` (EXP-001…005), más QA-018, QA-019 y QA-048. Mediciones de partida en local
sobre la build:
- axe: 0 violaciones en 6 páginas;
- Lighthouse escritorio: rendimiento 100, accesibilidad 100, buenas prácticas 96, SEO 100;
- LCP: entre 0,43 y 0,48 s;
- CLS: 0;
- TBT: 0 ms.

## Goals / Non-Goals

**Goals:** cuatro tipologías no funcionales dentro del mismo orquestador, con presupuestos que bloquean y métricas en
el histórico.

**Non-Goals:** pruebas en varios navegadores, carga contra despliegues y monitorización real de usuarios (RUM).

## Decisions

### 1. Accesibilidad y teclado como escenarios Gherkin

`tests/features/experience/accesibilidad.feature`:
- **Un `Scenario Outline` por tipo de página** (`@a11y`, `@clases-equivalencia`: cada tipo de página es una clase).
  El *step* ejecuta `AxeBuilder` con las etiquetas `wcag2a`, `wcag2aa`, `wcag21a` y `wcag21aa`, filtra por impacto
  `serious` o `critical` y falla con página, regla y selector.
- **Checkout y carrito con contenido:** se analizan después de preparar la sesión y el carrito.
- **Recorrido con teclado (EXP-002):** tabulador hasta "Añadir al carrito" e Intro. Para "foco visible" se comprueba
  que el elemento enfocado tiene un `outline` distinto de `none`. Se añade un estilo global `:focus-visible` con el
  color de marca.

### 2. Regresión visual con referencias por plataforma

- **Ubicación:** `snapshotPathTemplate: 'tests/visual/{arg}-{platform}{ext}'`. Las referencias quedan fuera de
  `.features-gen/` (que se regenera) y se distinguen por sistema.
- **Sin referencias:** el *step* comprueba si existe la referencia de la plataforma actual. Si no existe (y no se
  está en modo actualización `QA_UPDATE_SNAPSHOTS=1`), marca el test como omitido con el motivo (EXP-003, QA-007).
- **Workflow `visual-baselines.yml`** (manual): construye la tienda, ejecuta `@visual` con `--update-snapshots` en
  Linux y sube las referencias como artefacto. Se incorporan con un PR normal, que pasa el pipeline y la revisión.
  Un PR abierto directamente con el `GITHUB_TOKEN` no dispararía el pipeline, y los checks obligatorios no podrían
  pasar.
- **Comparación:** `maxDiffPixelRatio: 0.01`, `animations: 'disabled'`, página completa.

### 3. Etapa `performance` ("Rendimiento y carga")

`qa/stages/performance.ts`, bloqueante y dependiente de `build`:
1. Levanta la tienda en el 3410 con la base de E2E reiniciada.
2. **Lighthouse** por CLI (`npx lighthouse … --preset=desktop --output=json`) con el Chromium de Playwright, en
   portada, catálogo y ficha.
   - Se ejecuta por CLI porque `tsx` añade auxiliares (`__name`) que rompen las funciones que Lighthouse inyecta en
     el navegador.
3. `evaluateLighthouse(results, budget)` (pura, en `qa/lib/budgets.ts`) produce un test por página, trazado a
   EXP-004, con los incumplimientos en el mensaje.
4. **k6:** si está instalado, `k6 run tests/load/tienda.js --summary-export …` con 20 usuarios y 30 s. Lee p95 y tasa
   de errores, y `evaluateLoad()` produce el test de EXP-005. Si k6 no está, el test consta omitido con el motivo.
5. **Métricas:** `StagePartial` gana `metrics?`. El ensamblado fusiona las de todas las etapas en `run.metrics`:

```
metrics.lighthouse = [{ page, performance, accessibility, bestPractices, seo, lcpMs, cls, tbtMs }]
metrics.load = { p95Ms, errorRate, requests, vus, durationS }
```

**Orden de etapas:** static → build → e2e → **performance** → report.

**En CI:**
- *job* "4 · Rendimiento y carga", con la build descargada, Chromium y k6 instalados;
- el informe pasa a "5 · Informe" y la publicación a "6 · Publicar";
- los checks obligatorios de `main` se actualizan con el script de protección.

### 4. Informe (QA-018)

Sección *¿Es usable y rápida?*:
- barras agrupadas página × categoría de Lighthouse (escala 0–100, una línea de referencia en el presupuesto);
- indicadores de LCP medio, p95 de carga y tasa de errores;
- serie del rendimiento medio y del p95 por ejecución;
- estado de las pruebas `@a11y` por página;
- estado vacío si no hay métricas.

### 5. Auditor de experiencia

`qa-auditor-experiencia.md` lee `run.json` (o el informe) y deja `qa/agents/reviews/experiencia-<fecha>.md`: hallazgo,
impacto para el cliente, prioridad y propuesta. Tiene prohibido tocar presupuestos y umbrales.

## Gherkin

```gherkin
@experience @a11y @p1 @EXP-001 @clases-equivalencia
Scenario Outline: Las páginas clave no tienen barreras graves de accesibilidad
  When abro "<página>"
  Then la página no tiene violaciones de accesibilidad graves ni críticas
  Examples:
    | página |
    | /      |
    | /catalogo |
    ...
```

## Risks / Trade-offs

- **[Lighthouse tarda unos 10 s por página]** → 3 páginas, unos 30 s más de pipeline en un *job* paralelo al E2E.
- **[k6 no está en Windows]** → en local se omite con motivo y comando de instalación. En CI siempre corre.

## Migration Plan

Primera ejecución sin referencias visuales (omitidas). Tras fusionar, se lanza el workflow de referencias y se
incorporan por PR, junto al archivado.
