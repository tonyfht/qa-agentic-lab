# Design — QAL-001 Fundación del laboratorio

## Context

El repositorio solo contiene el arnés de OpenSpec, `AGENTS.md` y `CLAUDE.md`. El *porqué* está en `proposal.md` y los
requisitos en `specs/` (QA-001 a QA-034). Las decisiones D1–D12 de la propuesta están aprobadas. Este documento explica
cómo se materializan y qué se decide además.

Restricciones que dan forma al diseño:
- **Paridad local/CI (RT-2).** Ninguna lógica puede vivir solo en YAML de GitHub Actions.
- **Repositorio público sin secretos.** El pipeline completo tiene que funcionar sin ningún secreto.
- **Windows y Linux.** Los scripts tienen que funcionar igual en la máquina del fundador (Windows) y en
  `ubuntu-latest`. Por eso se escriben en TypeScript ejecutado con Node, no en bash.

## Goals / Non-Goals

**Goals:**
- Un único orquestador de etapas que usen igual una persona en local y GitHub Actions.
- Un contrato de resultados (v1) estable, que los cambios posteriores amplíen sin romper el histórico.
- Un informe propio que se abra desde disco, sin servidor, con los mismos ficheros en local y en Pages.

**Non-Goals:**
- Base de datos y datos de ejemplo de la tienda: QAL-001 no tiene datos de negocio. libSQL (D3) entra en QAL-002.
- Despliegue en Vercel (D6): entra en QAL-002.
- Agentes: no hay ninguno en este cambio. El formato reserva su sitio (`agentActions`), nada más.

## Decisions

### 1. Un solo paquete npm con Next.js en la raíz

La raíz del repositorio es el proyecto Next.js. `app/` contiene las rutas de la tienda y es la carpeta de rutas del App
Router, y `lib/` contiene la lógica de la tienda. El sistema de calidad vive al lado:

```
app/                    → rutas de la tienda (portada, /api/health, /api/openapi.json)
lib/                    → lógica de la tienda
tests/
  features/<dominio>/   → Gherkin (.feature)
  steps/                → steps de playwright-bdd
  unit/                 → Vitest
  support/              → fixtures y el reporter de resultados
qa/
  stages/               → una etapa por fichero (static, build, e2e, report, governance)
  run.ts                → orquestador: npm run qa [-- --stage <id>]
  results/              → esquema v1, escritura y lectura del histórico
report/                 → generador del informe (TypeScript → HTML estático)
schemas/run-result.v1.json → esquema JSON publicado (generado desde Zod)
```

*Alternativa descartada:* *workspaces* de npm (tienda, qa y report como paquetes). Añade complejidad de instalación y
de imports para un proyecto pequeño, y explicarlo cuesta más en la demo.

### 2. Orquestador de etapas

`qa/run.ts` (se ejecuta con `tsx`) tiene un registro de etapas. Cada etapa declara:
- su `id` y su nombre visible;
- si es **bloqueante**;
- de qué etapas depende;
- qué necesita (por ejemplo, un binario o un secreto) para saber si se puede ejecutar o debe omitirse con motivo
  (QA-007).

Primera versión:

| Orden | Etapa | Bloqueante | Depende de | Qué hace |
|---|---|---|---|---|
| 1 | `static` | sí | — | ESLint, `tsc --noEmit`, Gitleaks, enlaces internos del README, sintaxis Mermaid, pruebas unitarias |
| 2 | `build` | sí | — | `next build` y arranque de comprobación en el 3410 con `GET /api/health` |
| 3 | `e2e` | sí | `build` | Playwright + playwright-bdd contra la tienda en el 3410 (incluye `@smoke`) |
| 4 | `report` | no | — (se ejecuta siempre) | Ensambla el resultado, lo valida, lo añade al histórico y genera el informe |

- **Fallos y dependencias:** si falla `build`, `e2e` consta como `not_run` y no como superada (QA-001). `static` y
  `build` no dependen entre sí, así que un fallo de lint no impide saber si la tienda arranca (QA-005).
- **Resultados parciales:** cada etapa escribe `reports/runs/<runId>/stages/<id>.json`, y `report` los ensambla. En CI,
  cada etapa es un *job* y los parciales viajan entre *jobs* como artefactos.
- **Resumen:** el orquestador escribe el resumen en consola y, si existe `GITHUB_STEP_SUMMARY`, también en el resumen de
  la ejecución (QA-006), con el mismo código en los dos casos.

*Alternativa descartada:* Nx o Turborepo. Resuelven caché y grafos de tareas que aquí no hacen falta, y ocultan el
flujo que queremos enseñar.

### 3. Contrato de resultados v1

Se define con Zod en `qa/results/schema.ts`, y de ahí se genera `schemas/run-result.v1.json`, que se publica y se usa
en las pruebas. Campos principales:

```
schemaVersion: 1
runId, startedAt, finishedAt
origin:  { kind: local | ci, workflowRunUrl?, runNumber? }
git:     { sha, branch, dirty }
stages:  [{ id, name, blocking, status: passed | failed | skipped | not_run, durationMs, reason? }]
tests:   [{ id, title, file, stage, status: passed | failed | flaky | skipped, durationMs,
            retries, requirements: string[], tags: string[], detail?: { kind, path } }]
requirements: [{ id, title, capability, source }]   ← catálogo leído de las specs
metrics: {}          ← reservado (QAL-006)
findings: []         ← reservado (QAL-007)
agentActions: []     ← reservado (QAL-003, QAL-008)
```

- **`requirements`:** es el catálogo de todos los requisitos especificados, extraído de las cabeceras
  `### Requirement: <ID> ...` de `openspec/specs/` y de los *deltas* de los cambios en curso. Gracias a él se puede
  decir "27 de 30 cubiertos", y también qué requisitos no tienen ninguna prueba.
- **`flaky`:** lo calcula el reporter. Un test que falla y luego pasa en un reintento no es `passed` (QA-005).
- **Evolución del esquema:** el lector del histórico admite cualquier `schemaVersion` hasta la vigente. Los campos
  nuevos son opcionales, y un cambio incompatible sube la versión y añade su conversión (QA-012).

### 4. Del Gherkin al resultado

- **playwright-bdd** genera los tests de Playwright a partir de `tests/features/**/*.feature`. Las etiquetas de
  escenario (`@QA-001 @smoke @e2e @p1`) llegan a cada test como *tags*.
- **Un reporter propio de Playwright** (`tests/support/run-result-reporter.ts`) escribe el parcial de la etapa `e2e`:
  - toma los IDs de requisito de los *tags* con el patrón `^[A-Z]+-\d{3}$`;
  - marca como no trazados los tests que no tienen ninguno (QA-011);
  - enlaza la traza al informe HTML de Playwright de esa ejecución (QA-016).
- **Vitest** usa su reporter JSON, y una pequeña conversión lo lleva al mismo formato. Las pruebas unitarias se trazan
  con el ID en el nombre del `describe` (`describe('QA-012 Histórico acumulado', ...)`).

### 5. Informe propio (D10)

- **Construcción:** `report/build.ts` lee el histórico y la ejecución actual y escribe un sitio estático en
  `reports/site/`:
  - `index.html`;
  - `data.js`, con los datos como variable global, para que **se abra con doble clic** sin problemas de CORS;
  - ECharts, copiado de `node_modules`.
- **Vista previa:** `npm run report` lo construye y lo sirve en el 3420.
- **Contenido de la v1** (según el boceto aprobado; ver *Dirección visual*):
  - cabecera con la ejecución;
  - banda de estado con icono y texto;
  - cuatro indicadores (tests, requisitos cubiertos, tests sin trazar, duración) con su diferencia frente a la
    ejecución anterior;
  - la tira del pipeline;
  - los tres gráficos de QA-014: tendencia, tiempo por etapa y cobertura;
  - la tabla de trazabilidad.
- **Estados vacíos:** un gráfico sin datos suficientes muestra un mensaje explicativo, nunca un lienzo vacío (QA-014).
- **Accesibilidad del informe:** cada gráfico tiene una alternativa en tabla, se puede usar con teclado y los estados
  van siempre con icono y texto.

### 6. Publicación e histórico (D11)

- **Workflow `pipeline.yml`:** *jobs* `static`, `build`, `e2e` y `report`. Cada uno ejecuta
  `npm run qa -- --stage <id>`, no lleva lógica propia (QA-003) y no necesita secretos.
- **Disparadores** (QA-004):
  - `pull_request` contra `main`;
  - `push` a `main`;
  - `workflow_dispatch`;
  - `schedule` diario a las 05:30 UTC.
- **Publicación:** solo si `github.ref == 'refs/heads/main'`, un *job* `publish` (con
  `concurrency: { group: pages-publish, cancel-in-progress: false }`) hace lo siguiente:
  1. trae la rama `gh-pages`;
  2. añade la línea al `history/runs.ndjson`;
  3. regenera el informe;
  4. hace commit en `gh-pages`, y Pages se sirve desde esa rama.

  La concurrencia evita escrituras simultáneas (QA-013).
- **Detalle técnico:** el informe HTML de Playwright de cada ejecución se guarda en `runs/<runNumber>/playwright/`. Se
  conservan las 30 últimas ejecuciones con detalle; el histórico resumido no se poda nunca.
- **Ejecuciones de PR:** el informe se sube como artefacto y no se publica.

*Alternativa descartada:* `actions/deploy-pages` con artefacto. No conserva estado entre ejecuciones, así que el
histórico tendría que vivir en otro sitio.

### 7. Comprobaciones de documentación dentro de `static`

- **Enlaces internos** (QA-031): un script recorre los Markdown del repositorio y comprueba que cada enlace relativo
  apunta a un fichero existente y, si lleva ancla, a un encabezado existente. Los enlaces externos no se comprueban:
  dependen de terceros y harían el pipeline inestable.
- **Mermaid** (QA-032): un script extrae los bloques ` ```mermaid ` y los valida con `mermaid.parse()` dentro de
  Chromium, reutilizando el de Playwright para no añadir otro navegador.
- **Secretos** (QA-023): Gitleaks con una configuración versionada (`.gitleaks.toml`) que lista las excepciones y su
  motivo. Si no está instalado en local, la comprobación consta como omitida con motivo; en CI se instala siempre.

### 8. Gobierno (QA-020 a QA-025)

- **Comprobación del PR:** `qa/stages/governance.ts` comprueba que la descripción del PR contiene `QAL-\d{3}` y que
  ese cambio existe en `openspec/changes/` (también en el archivo), o bien que lleva la casilla de mantenimiento
  marcada. Se ejecuta en el workflow `governance.yml` (`pull_request: opened, edited, synchronize`). En local se
  puede ejecutar con `npm run qa -- --stage governance --pr-body <fichero>`.
- **Protección de `main`:** se configura con `gh api` mediante un script versionado (`scripts/setup-branch-protection.mjs`):
  - PR obligatorio;
  - comprobaciones requeridas: `static`, `build`, `e2e` y `governance`;
  - 1 aprobación;
  - el administrador puede saltarse la revisión.

  Así el fundador fusiona sus propios PR (GitHub no permite aprobar un PR propio), mientras que **los PR de agentes y
  bots exigen su aprobación** (QA-020). El salto queda registrado en el PR.
- **Dependabot:** `npm` y `github-actions`, semanal (QA-024).
- **Saltos de línea:** `.gitattributes` con `* text=auto eol=lf` y los binarios marcados. Tras añadirlo se ejecuta
  `git add --renormalize .` (QA-025).
- **Versión de Node:** `engines: { node: ">=24" }` en `package.json` y `engine-strict=true` en `.npmrc`. Así
  `npm ci` falla con un mensaje claro en versiones anteriores (QA-033).

### 9. Esqueleto de la tienda

- **Next.js:** última versión estable al implementar, con TypeScript estricto y Tailwind.
- **Portada:** marca, una frase de qué es la tienda y un aviso de "en construcción".
- **`GET /api/health`:** devuelve `{ status: "ok", version }`, con `version` tomada de `package.json`.
- **`GET /api/openapi.json`:** se genera desde los esquemas Zod de las rutas (D2). En QAL-001 solo contiene `health`.
- **Puertos** (D9): 3400 en `dev` y `start`, 3410 cuando lo levantan las pruebas, 3420 para la vista previa del
  informe.

## Gherkin

Origen de `tests/features/quality/smoke.feature`:

```gherkin
@QA-001 @e2e @smoke @p1
Feature: La tienda arranca y responde
  Como equipo de calidad
  quiero comprobar en cada ejecución que la tienda está viva
  para no lanzar pruebas contra una aplicación caída

  Scenario: La API responde a la comprobación de salud
    When consulto el estado de salud de la API
    Then la respuesta es correcta
    And indica la versión de la aplicación

  Scenario: La portada muestra la marca
    When abro la portada de la tienda
    Then veo el nombre "La Tienda en Casa"
```

El escenario de error de QA-001 ("La tienda no arranca") es comportamiento del orquestador, no de la tienda. Se cubre
con una prueba unitaria del orquestador, con `describe('QA-001 ...')`.

## Tipologías por requisito

| Requisitos | Tipología | Dónde |
|---|---|---|
| QA-001 | E2E (Gherkin) + unitaria del orquestador | `tests/features/quality/`, `tests/unit/qa/` |
| QA-002, QA-005, QA-006, QA-007 | Unitaria del orquestador | `tests/unit/qa/run.test.ts` |
| QA-003, QA-004, QA-013 | Verificación en GitHub (ejecuciones reales) | Criterios de éxito 2 y 5 |
| QA-010, QA-011, QA-012 | Unitaria (esquema, reporter, histórico) | `tests/unit/qa/results/` |
| QA-014, QA-015, QA-016 | Unitaria del generador + E2E del informe generado | `tests/unit/report/`, `tests/e2e/report.spec.ts` |
| QA-020, QA-024 | Verificación de configuración en GitHub | Tarea de verificación |
| QA-021 | Unitaria de la comprobación de gobierno | `tests/unit/qa/governance.test.ts` |
| QA-022, QA-030, QA-033, QA-034 | Revisión, más la existencia de ficheros comprobada en unitaria | `tests/unit/repo/` |
| QA-023, QA-031, QA-032 | Unitaria de los comprobadores con casos que pasan y que fallan | `tests/unit/qa/checks/` |
| QA-025 | Unitaria: `git ls-files --eol` sin CRLF en el índice | `tests/unit/repo/` |

## Dirección visual (pendiente de tu elección)

Los bocetos están en [`bocetos/`](bocetos/). Se sirven con `npx http-server openspec/changes/qal-001-fundacion/bocetos -p 3420`.

**Logo** ([`logos.html`](bocetos/logos.html)): tres direcciones con la misma tipografía (la del sistema, en negrita),
el subtítulo "Calidad con IA, gobernada por especificación" y la paleta índigo `#4f46e5` + verde azulado `#0d9488`
(validada para daltonismo). Cada SVG cambia sus colores con el tema del visitante, también dentro del README de GitHub.

| Opción | Idea | A favor | En contra |
|---|---|---|---|
| A · Matraz | "Lab" literal: agentes dentro de un matraz y un check que sube | El más narrativo; dice "laboratorio" | Se lee peor en pequeño (favicon) |
| **B · Escudo** (recomendada) | Calidad como garantía: el check está hecho de agentes conectados | Legible a cualquier tamaño; funciona como favicon e icono del informe | El escudo es un motivo frecuente en seguridad |
| C · Lupa | Inspección de una red de agentes | Muy "tecnológico" | Recargado en pequeño; la lupa es un tópico del testing |

**Informe** ([`informe.html`](bocetos/informe.html), datos de ejemplo):
- **Orden de lectura:** de arriba abajo, de lo ejecutivo a lo técnico: estado global → indicadores → pipeline →
  tendencia → tiempo y cobertura → trazabilidad.
- **Colores de estado:** fijos, siempre con icono y texto (✔ superado, ⚠ inestable, ✖ fallido, ○ omitido o sin
  pruebas). El índigo de marca se usa para lo que no es un estado (duraciones, IDs).
- **Pregunta de cada gráfico:** en negrita sobre él, como pide QA-014.
- **Tema y móvil:** tema claro y oscuro seleccionados, no invertidos, y diseño que funciona en móvil.
- **Lo que irá apareciendo:** una sección con los gráficos que traerán los cambios siguientes, para que la persona
  sepa qué irá viendo.

## Risks / Trade-offs

- **[El esquema v1 se queda corto]** → Los campos reservados y opcionales y el lector multiversión lo hacen ampliable
  sin migrar. Un cambio incompatible sube la versión y añade su conversión, con prueba.
- **[`gh-pages` crece con el detalle técnico]** → Poda a 30 ejecuciones con detalle. El histórico resumido son unos
  pocos KB por ejecución.
- **[Jobs separados alargan el pipeline (instalación repetida)]** → Caché de `node_modules` y de los navegadores de
  Playwright por *hash* del *lockfile*. A cambio, cada etapa se ve en GitHub, que es lo que queremos enseñar.
- **[Validar Mermaid con Chromium es pesado para una comprobación estática]** → Reutiliza el navegador ya instalado
  para E2E y solo se lanza si hay bloques Mermaid cambiados o en CI.
- **[El salto de revisión del administrador podría usarse con PR de agentes]** → La regla del proyecto lo prohíbe
  (AGENTS.md, principio 3) y el salto queda visible en el PR. Se revisa si entra más gente en el proyecto.
- **[Gitleaks no está instalado en local]** → La comprobación consta como omitida con motivo (QA-007), nunca como
  superada. El README indica cómo instalarlo.

## Migration Plan

No aplica: repositorio nuevo. La primera publicación en `main` crea la rama `gh-pages` y activa Pages desde ella. Si
algo sale mal, se borra `gh-pages`, y la siguiente ejecución en `main` la recrea con un histórico nuevo.

## Open Questions

- Hora exacta de la ejecución programada (propuesta: 05:30 UTC). Se puede cambiar sin tocar specs ni tareas.
