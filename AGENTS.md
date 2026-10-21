# QA Agentic Lab — Guía para agentes

Briefing base para cualquier agente (IA o persona) que trabaje en este repositorio. Léelo completo antes de tocar nada.

---

## Qué es este proyecto

Laboratorio público que demuestra **automatización de pruebas con agentes de IA dentro de un ciclo de vida gobernado
por especificación (SDD)**. Tiene dos mitades en un mismo repositorio:

| Mitad | Qué es | Dónde vive |
|---|---|---|
| **Producto** | *La Tienda en Casa*: e-commerce pequeño de artículos para el hogar (catálogo con búsqueda y filtros, carrito, cupones, checkout con pago simulado, pedidos) | `app/` |
| **Sistema de calidad** | Pruebas de todas las tipologías, pipeline por etapas, agentes de QA, trazabilidad e informe de calidad con histórico | `tests/`, `.claude/agents/`, `.github/workflows/`, `report/` |

La tienda existe **para ser probada**: es deliberadamente pequeña. Si una funcionalidad no sirve para enseñar una
técnica o tipología de prueba, no se construye.

Público objetivo: proyecto **formativo y sin ánimo de lucro**, para personas que se inician en QA y para clientes a los
que se presenta el laboratorio. Todo lo visible (README, informe, specs) debe poder explicarse **desde cero** a
alguien que no sabe de QA ni conoce el proyecto.

> Estado: fundación terminada (`QAL-001`, archivado). Stack, estructura, pipeline e informe están fijados; los agentes de QA llegan con
> sus propios cambios (ver la hoja de ruta en [`openspec/PROJECT.md`](openspec/PROJECT.md#hoja-de-ruta)).

---

## Principios (no negociables)

1. **La especificación es la fuente de verdad.** Ningún código de producto ni de pruebas sin un cambio de OpenSpec
   aprobado que lo pida. Los escenarios GIVEN/WHEN/THEN de las specs son el origen de los `.feature` Gherkin.
2. **La IA diseña, repara y explica; no decide.** El veredicto de calidad (pasa/falla, se fusiona/no se fusiona) lo dan
   pruebas deterministas y *quality gates*. Ningún agente puede aprobar su propio trabajo.
3. **Todo cambio de un agente entra por Pull Request** revisado por una persona. Nunca push directo a `main`.
4. **El Sanador repara tests, no comportamiento.** Puede cambiar selectores, esperas o estructura de un test; nunca una
   aserción sobre el comportamiento esperado. Si el fallo es del producto, se abre un defecto, no se "cura".
5. **Trazabilidad de punta a punta** con un único identificador por requisito (ver Convenciones).
6. **Repositorio público**: cero secretos en el código; claves solo en *GitHub Secrets*. Nada de datos personales
   reales: usuarios, direcciones y tarjetas son ficticios.
7. **Solo se atacan sistemas propios.** Carga (k6) y escaneo activo de seguridad (ZAP) se ejecutan contra la tienda
   levantada en el propio runner o en nuestro despliegue, nunca contra terceros.
8. **Lo mismo en local que en CI.** Cada etapa del pipeline es un script de npm; GitHub Actions solo los llama.
   `npm run qa` reproduce en local lo que hace CI, con el mismo resultado y el mismo informe.
9. **Cada cambio deja el laboratorio enseñable.** Si añade algo visible, actualiza la ruta de la visita y los diagramas
   del README, y aporta sus datos al informe.

Visión, requisitos transversales (RT-1 a RT-5) y hoja de ruta: [`openspec/PROJECT.md`](openspec/PROJECT.md).

---

## Flujo SDD con OpenSpec

Toda funcionalidad nueva (de la tienda o del sistema de calidad) sigue este orden con los comandos `/opsx:*`:

| Paso | Comando | Gate |
|---|---|---|
| 0. Explorar (opcional) | `/opsx:explore` | — |
| 1. Proponer | `/opsx:propose QAL-XXX-nombre` | `proposal.md` nace en `borrador`; **no se implementa sin aprobación explícita** |
| 2. Implementar | `/opsx:apply` | Código, Gherkin y tests juntos; pipeline en verde |
| 3. Ajustar (si aplica) | `/opsx:update` | Artefactos coherentes con lo implementado |
| 4. Archivar | `/opsx:archive QAL-XXX-nombre` | Tareas cerradas, specs sincronizadas, fila en `openspec/README.md` |

- **IDs de cambio:** `QAL-XXX-nombre-descriptivo` (3 dígitos, kebab-case). Siguiente libre: `openspec/README.md`.
- **Rama de trabajo:** `change/qal-0xx-<nombre>`. Fusión a `main` por PR, sin *squash*.
- "Cuéntame cómo lo harías" **no** es autorización para implementar.

---

## Convenciones

**Identificadores de requisito.** Cada requisito de una spec lleva un ID estable `<DOMINIO>-<NNN>` al inicio de su
nombre (`### Requirement: CAT-001 Búsqueda por texto`). El mismo ID aparece como etiqueta en el escenario Gherkin
(`@CAT-001`), en el test automatizado y en el informe. Es la columna vertebral de la trazabilidad.

| Dominio | Prefijo |
|---|---|
| Catálogo | `CAT` |
| Carrito | `CART` |
| Promociones y cupones | `PROMO` |
| Checkout y pago simulado | `CHK` |
| Pedidos | `ORD` |
| Cuenta y acceso | `ACC` |
| Sistema de calidad (pipeline, agentes, informe) | `QA` |

**Idioma.** Documentación, specs, Gherkin y textos de la tienda en **español**. Código e identificadores en inglés
técnico. Palabras clave estructurales de OpenSpec (`Requirement`, `Scenario`, `SHALL`, `MUST`) y de Gherkin en inglés
(`Feature`, `Scenario`, `Given`...) para que las herramientas las reconozcan.

**Etiquetas Gherkin.** Además del ID: tipología (`@e2e`, `@api`, `@a11y`, `@visual`...), prioridad (`@p1`..`@p3`) y
`@smoke` para el subconjunto crítico.

---

## Stack

Next.js 16 (App Router) + TypeScript estricto + Tailwind 4 · libSQL (SQLite local, se crea y rellena sola en `.data/`) ·
Zod (y OpenAPI generado desde Zod) · Playwright +
playwright-bdd · Vitest · ECharts · Node 24 (estricto, `engine-strict`) · npm.

## Estructura del repositorio

```
app/                  → La Tienda en Casa: rutas de Next.js (portada, /api/health, /api/openapi.json)
lib/                  → lógica de la tienda: catalog/ (consulta pura), db/ (libSQL y datos de ejemplo), api/ (Zod + OpenAPI)
tests/
  features/<dominio>/ → Gherkin (.feature), etiquetado con el ID de requisito (@QA-001)
  steps/              → steps de playwright-bdd
  unit/               → Vitest; el ID de requisito va al inicio del describe exterior
  support/            → reporter de resultados y datos de ejemplo
qa/
  run.ts              → orquestador: npm run qa [-- --stage <id>]
  stages/             → una etapa por fichero; registry.ts fija el orden
  checks/             → enlaces, Mermaid y secretos (etapa static)
  results/            → contrato run-result v1, histórico y catálogo de requisitos
  publish.ts          → publicación en gh-pages (solo CI, solo main)
report/               → generador del informe (template/ + build.ts + serve.ts)
schemas/              → JSON Schema publicado del resultado de una ejecución
.github/              → workflows, plantillas de PR e issues, CODEOWNERS, Dependabot
docs/assets/          → logo y recursos del README
openspec/             → specs, cambios y archivo (fuente de verdad)
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Tienda en desarrollo en el 3400 |
| `npm run qa` | Pipeline completo: static → build → e2e → report |
| `npm run qa -- --stage <id>` | Una etapa (y sus previas). `governance` necesita `--pr-body <fichero>` |
| `npm run report` | Informe con el histórico local en el 3420 |
| `npm run test:unit` | Solo las pruebas unitarias |
| `node scripts/setup-branch-protection.mjs` | Reglas de protección de `main` (tras cambiar nombres de jobs) |

**Reglas al añadir pruebas:** todo test lleva el ID de su requisito (etiqueta Gherkin o inicio del `describe`); si no,
el informe lo muestra como "sin trazar". Si cambia el esquema de resultados, se sube `SCHEMA_VERSION`, se añade su
conversión en `qa/results/history.ts` y se regenera `schemas/` con `npx tsx qa/results/export-schema.ts`.

---

## Puertos en local

La demo completa se puede levantar en local además de en la demo pública.

| Puerto | Uso |
|---|---|
| **3400** | La Tienda en Casa (`npm run dev` / `npm start`) |
| **3410** | Tienda levantada por las pruebas E2E (Playwright) |
| **3420** | Vista previa local del informe de calidad (`npm run report`) |

No usar puertos de otros proyectos de la máquina: 3000 (Aigovia), 3100/3110/3120/3150/3200 (Pensend y su comité),
3333, 5173 y 54321. Un puerto nuevo se elige libre y se añade a esta tabla.

---

## Agentes de QA

| Agente | Función | Cuándo actúa | Definición |
|---|---|---|---|
| Revisor de specs | Detecta ambigüedad, requisitos no comprobables y huecos antes de diseñar pruebas | Requisitos | [`qa-revisor-specs`](.claude/agents/qa-revisor-specs.md) |
| Analista | Explora la tienda y convierte las specs en `.feature` con riesgos y prioridades | Diseño | [`qa-analista`](.claude/agents/qa-analista.md) |
| Diseñador de casos | Aplica técnicas (equivalencia, valores límite, tablas de decisión, *pairwise*) a los escenarios | Diseño | [`qa-disenador`](.claude/agents/qa-disenador.md) |
| Automatizador | Implementa los *steps* y tests, y solo entrega lo que pasa | Automatización | [`qa-automatizador`](.claude/agents/qa-automatizador.md) |
| Agente de API | Diseña pruebas de contrato y negocio desde la especificación OpenAPI | Automatización | QAL-005 |
| Sanador | Repara tests rotos por cambios no funcionales; abre PR con evidencia | Tras un fallo en CI | QAL-008 |
| Detector de *flaky* | Detecta tests inestables con el histórico y propone su corrección o cuarentena | Tras cada ejecución | QAL-008 |
| Triaje | Clasifica fallos y abre *issues* de defecto con evidencia | Tras un fallo en CI | QAL-008 |
| Auditor de experiencia | Interpreta accesibilidad, rendimiento y regresión visual en lenguaje de negocio | Tras cada ejecución | QAL-006 |
| Auditor de seguridad y cumplimiento | Prioriza hallazgos de SAST, dependencias, licencias, secretos y DAST | Tras cada ejecución | QAL-007 |
| Reportero | Compara con el histórico, redacta el resumen ejecutivo y recomienda si se puede salir | Tras cada ejecución | QAL-009 |

**Reglas para todo agente:** su definición tiene las secciones Función, Entradas, Salidas, Herramientas, Prohibido y
Registro (lo comprueba la etapa `static`). Cada actuación se registra en `qa/agents/actions.ndjson`, y su trabajo entra
por PR con el mismo pipeline y la misma revisión que el de una persona. Los Playwright Test Agents
(`playwright-test-*`) son herramientas de base y se regeneran con `npx playwright init-agents --loop=claude`.

Herramientas por fase (Playwright MCP, Playwright Test Agents, GitHub MCP, GitHub Action de Claude Code...): mapa en
[`openspec/PROJECT.md`](openspec/PROJECT.md).

Las *quality gates* son deterministas; un agente solo puede explicar por qué una gate bloquea, no levantarla.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
