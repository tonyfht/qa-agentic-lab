# QAL-006 — Experiencia: accesibilidad, regresión visual, rendimiento y carga

**Estado:** aprobado (mandato del fundador del 2026-10-21: ejecutar la hoja de ruta completa) · **Fecha:** 2026-10-21 ·
**Tipo:** calidad no funcional + IA

## Why

Hasta ahora el laboratorio prueba **qué hace** la tienda. Una tienda que funciona puede seguir siendo inaccesible,
lenta, visualmente rota o caerse con veinte personas comprando a la vez. Son las pruebas que más se olvidan y las que
más cuestan en producción. Este cambio las mete en el ciclo con **presupuestos que bloquean**, igual que un test
funcional, y con un agente que las traduce a lenguaje de negocio.

## What Changes

- **Accesibilidad (WCAG 2.1 AA)** con axe sobre las páginas clave, cada una como escenario Gherkin `@a11y`, más un
  recorrido solo con teclado (añadir al carrito y aplicar un cupón). Bloquea cualquier violación grave o crítica.
- **Regresión visual** de portada, catálogo y ficha, comparando con referencias aprobadas:
  - las referencias se generan en Linux (el sistema de CI) con un workflow manual y entran por PR revisado;
  - mientras no existan para la plataforma, la comprobación consta como omitida con su motivo.
- **Rendimiento con Lighthouse** en portada, catálogo y ficha, con presupuestos:
  - rendimiento ≥ 85;
  - accesibilidad, buenas prácticas y SEO ≥ 90;
  - LCP ≤ 2,5 s, CLS ≤ 0,1 y TBT ≤ 300 ms.
- **Carga con k6** contra la tienda levantada en el propio runner, nunca contra terceros: 20 usuarios virtuales
  durante 30 s navegando catálogo, ficha y API, con p95 < 500 ms y errores < 1 %. Sin k6 instalado, se omite con el
  motivo y cómo instalarlo.
- **Nueva etapa del pipeline "Rendimiento y carga"** (job propio en CI, el mismo comando en local). Sus métricas
  entran en el resultado de la ejecución.
- **Informe:** sección *¿Es usable y rápida?* con:
  - puntuaciones de Lighthouse por página;
  - evolución del rendimiento;
  - p95 y errores de la prueba de carga;
  - violaciones de accesibilidad.
- **Auditor de experiencia** (`qa-auditor-experiencia`): convierte las métricas en hallazgos priorizados en lenguaje
  de negocio. Su primera auditoría queda registrada.

## Capabilities

### New Capabilities

- `experience`: accesibilidad, teclado, regresión visual, presupuestos de rendimiento y carga (`EXP-0xx`).

### Modified Capabilities

- `quality-pipeline`: QA-019 (etapa de rendimiento y carga).
- `quality-report`: QA-018 (¿Es usable y rápida?).
- `qa-agents`: QA-048 (Auditor de experiencia).

## Valor para la demo

- **Accesibilidad:** una violación de accesibilidad para el pipeline igual que un bug funcional, y el informe dice en
  qué página y por qué.
- **Carga:** una prueba de carga real en cada ejecución sin infraestructura propia: la tienda se levanta en el runner
  y se le "ataca" a ella misma.
- **Regresión visual con gobierno:** las referencias no las acepta nadie en silencio, entran por PR.

## Testing scope

- **Tipologías:**
  - accesibilidad (`@a11y`);
  - teclado;
  - regresión visual (`@visual`);
  - rendimiento (Lighthouse);
  - carga (k6);
  - unitarias de los evaluadores de presupuestos.
- **Riesgo:** medio. Las métricas varían entre máquinas. Los presupuestos se fijan con margen sobre lo medido
  (rendimiento 100 y LCP de 0,43 s en local) y se documentan.

## Cumplimiento de los requisitos transversales

- **RT-1:** cuatro tipologías no funcionales nuevas.
- **RT-2:** mismos comandos en local y en CI. Lo que necesite Linux (referencias visuales) o una herramienta (k6) se
  omite con motivo, nunca en silencio.
- **RT-3:** las métricas entran en el resultado y el informe.
- **RT-4:** ruta de la visita y diagrama del pipeline actualizados.
- **RT-5:** Auditor de experiencia.

## Fuera de alcance

- Pruebas en dispositivos reales o en varios navegadores (Firefox, WebKit).
- Carga contra la demo pública.

## Riesgos

- **[Variabilidad de Lighthouse en CI]** → presupuestos con margen y la mediana de 1 ejecución por página. Si da
  falsos positivos, se pasa a 3 ejecuciones.
- **[Regresión visual inestable por fuentes]** → referencias por plataforma, umbral de diferencia del 1 % y solo en
  CI (Linux).

## Criterios de éxito

1. Las páginas clave pasan axe sin violaciones graves o críticas, y el recorrido con teclado funciona.
2. La etapa "Rendimiento y carga" corre en local y en CI, aplica los presupuestos y deja sus métricas en el resultado.
3. Las referencias visuales se generan en CI y entran por PR. Desde entonces, la regresión visual se ejecuta en cada
   PR.
4. El informe muestra *¿Es usable y rápida?* con datos reales.
5. El Auditor de experiencia tiene una actuación registrada.

## Impact

Dependencias: `@axe-core/playwright`, `lighthouse` y `chrome-launcher` (desarrollo). k6 como binario. Nuevos:
`qa/stages/performance.ts`, `tests/load/`, `tests/features/experience/`, `.github/workflows/visual-baselines.yml`,
`.claude/agents/qa-auditor-experiencia.md`.
