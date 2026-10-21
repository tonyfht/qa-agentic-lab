# Tasks — QAL-001 Fundación del laboratorio

Rama de trabajo: `change/qal-001-fundacion`. Specs en `specs/`; cómo construirlo, en `design.md`.

## 0. Antes de empezar

- [x] 0.1 Elegir el logo (A, B o C) y validar la dirección visual del informe a partir de `bocetos/`. Se verifica
  cuando la elección queda anotada en `design.md`, sección *Dirección visual*.

## 1. Base del repositorio

- [x] 1.1 Crear `.gitattributes` (`* text=auto eol=lf`, binarios marcados) y renormalizar. Se verifica con
  `git ls-files --eol`, que no muestra `i/crlf` (QA-025).
- [x] 1.2 Crear el proyecto Next.js en la raíz con TypeScript estricto, Tailwind, `engines.node >=24` y
  `engine-strict=true` en `.npmrc`. Se verifica con `npm ci` en verde en Node 24 y con error claro en una versión
  anterior.
- [x] 1.3 Fijar puertos: `dev` y `start` en el 3400. Se verifica con `npm run dev`, que sirve en
  `http://localhost:3400`.
- [x] 1.4 Configurar ESLint y `tsc --noEmit` como scripts. Se verifica con `npm run lint` y `npm run typecheck` en
  verde.
- [x] 1.5 Configurar Vitest con `tests/unit/`. Se verifica con `npm run test:unit` en verde con una prueba trivial.

## 2. Esqueleto de La Tienda en Casa

- [x] 2.1 Portada con la marca, una frase de qué es y el aviso "en construcción". Se verifica abriéndola en el 3400.
- [x] 2.2 `GET /api/health` con su esquema Zod: devuelve `{ status, version }` con la versión de `package.json`. Se
  verifica con una prueba unitaria del *handler* (QA-001).
- [x] 2.3 `GET /api/openapi.json` generado desde los esquemas Zod, con la operación `health`. Se verifica con una
  prueba unitaria que comprueba que el documento es OpenAPI válido e incluye `/api/health`.

## 3. Contrato de resultados e histórico

- [x] 3.1 Esquema v1 en Zod (`qa/results/schema.ts`) y generación de `schemas/run-result.v1.json`. Se verifica con
  pruebas de que un resultado válido pasa y uno inválido falla, indicando el campo (QA-010).
- [x] 3.2 Extractor del catálogo de requisitos desde `openspec/specs/` y los *deltas* en curso. Se verifica con una
  prueba de que encuentra QA-001…QA-034 de este cambio y no duplica IDs.
- [x] 3.3 Escritura y lectura de `runs.ndjson`: añadir sin tocar registros anteriores y leer versiones anteriores. Se
  verifica con pruebas de N→N+1, de registros intactos, de rechazo de un resultado inválido sin modificar el histórico
  y de lectura de un registro `schemaVersion: 0` simulado (QA-012).

## 4. Orquestador de etapas

- [ ] 4.1 `qa/run.ts` con registro de etapas (id, nombre, bloqueante, dependencias, requisitos) y
  `npm run qa [-- --stage <id>]`. Se verifica con pruebas del orden, de una sola etapa con sus previas y de un error
  con lista de etapas ante una inexistente (QA-002).
- [ ] 4.2 Semántica de fallos: bloqueante fallida → ejecución en rojo; dependientes → `not_run`; independientes se
  ejecutan; `report` siempre. Se verifica con pruebas del caso "la tienda no arranca" (QA-001, QA-005).
- [ ] 4.3 Omisión con motivo cuando falta un binario o un secreto. Se verifica con una prueba de que la etapa consta
  `skipped` con su motivo y no cuenta como superada (QA-007).
- [ ] 4.4 Resumen en consola y en `GITHUB_STEP_SUMMARY` con el mismo código. Se verifica con una prueba de que ambos
  contienen una fila por etapa y el enlace al informe (QA-006).
- [ ] 4.5 Etapa `build`: `next build` y arranque en el 3410 con `GET /api/health`. Se verifica con
  `npm run qa -- --stage build` en verde.

## 5. Pruebas E2E con Gherkin y trazabilidad

- [ ] 5.1 Instalar Playwright y playwright-bdd; `webServer` en el 3410. Se verifica con `npx bddgen` sin errores.
- [ ] 5.2 Crear `tests/features/quality/smoke.feature` (Gherkin del `design.md`) y sus *steps*. Se verifica con
  `npm run qa -- --stage e2e` en verde (QA-001).
- [ ] 5.3 Reporter propio que escribe el parcial de `e2e`: requisitos desde los *tags*, `flaky` si pasa al reintentar,
  no trazados, detalle técnico enlazado. Se verifica con pruebas unitarias sobre resultados simulados de Playwright
  (QA-005, QA-011, QA-016).
- [ ] 5.4 Conversión del JSON de Vitest al mismo formato, con requisitos desde el `describe`. Se verifica con una
  prueba de que las unitarias trazadas aparecen con su ID.

## 6. Comprobaciones de la etapa `static`

- [ ] 6.1 Comprobador de enlaces internos de Markdown (ficheros y anclas). Se verifica con pruebas de un enlace válido,
  un fichero inexistente y un ancla inexistente (QA-031).
- [ ] 6.2 Validador de bloques Mermaid con `mermaid.parse()` en Chromium. Se verifica con pruebas de un diagrama
  válido y uno con sintaxis rota (QA-032).
- [ ] 6.3 Gitleaks con `.gitleaks.toml` (excepciones con motivo) y omisión con motivo si no está instalado. Se verifica
  con pruebas de un secreto falso detectado, una excepción respetada y la omisión (QA-023).
- [ ] 6.4 Etapa `static` completa (lint, tipos, unitarias, enlaces, Mermaid, secretos). Se verifica con
  `npm run qa -- --stage static` en verde.

## 7. Informe propio

- [ ] 7.1 Generador `report/build.ts` → `reports/site/` (`index.html`, `data.js`, ECharts local), siguiendo la
  dirección visual elegida en 0.1. Se verifica con una prueba de que el sitio se genera desde un histórico de ejemplo
  y abre desde disco sin peticiones de red (QA-015).
- [ ] 7.2 Indicadores con diferencia frente a la ejecución anterior, tira del pipeline y tabla de trazabilidad con
  requisitos sin pruebas. Se verifica con pruebas del cálculo de diferencias y de cobertura (QA-011, QA-014).
- [ ] 7.3 Gráficos de tendencia, tiempo por etapa y cobertura, cada uno con su pregunta, su tabla alternativa y su
  estado vacío. Se verifica con una prueba E2E sobre el informe generado: preguntas visibles, mensaje con un solo
  registro y tabla accesible (QA-014).
- [ ] 7.4 Enlace al detalle técnico, o aviso sin enlace roto si no existe. Se verifica con una prueba E2E sobre un
  test fallido con y sin traza (QA-016).
- [ ] 7.5 `npm run report`: construye con el histórico local de `reports/` y sirve en el 3420. Se verifica tras dos
  `npm run qa`, con dos puntos en la tendencia en `http://localhost:3420` (QA-015).

## 8. Pipeline en GitHub Actions

- [ ] 8.1 `pipeline.yml` con *jobs* `static`, `build`, `e2e` y `report`, que solo llaman a
  `npm run qa -- --stage <id>`, con parciales por artefacto y cachés de `node_modules` y navegadores. Se verifica con
  un PR que muestra los cuatro *jobs* separados en verde (QA-003).
- [ ] 8.2 Disparadores: PR a `main`, push a `main`, `workflow_dispatch` y `schedule` diario. Se verifica con una
  ejecución manual sin secretos en verde (QA-004).
- [ ] 8.3 *Job* `publish`, solo en `main`, con `concurrency: pages-publish`: histórico en `gh-pages`, regeneración,
  detalle en `runs/<n>/playwright/` con poda a 30 y Pages desde `gh-pages`. Se verifica con dos ejecuciones en `main`
  que dejan dos registros y el informe público actualizado (QA-013, QA-015).
- [ ] 8.4 En PR, el informe solo como artefacto. Se verifica con un PR que no cambia `gh-pages` (QA-013).

## 9. Gobierno del repositorio

- [ ] 9.1 Plantilla de PR (ID QAL, casilla de mantenimiento, lista de README e informe) y plantillas de *issue*
  (defecto y requisito). Se verifica con una prueba de que existen con sus campos obligatorios (QA-022, QA-034).
- [ ] 9.2 Etapa `governance` y workflow `governance.yml`. Se verifica con pruebas de ID válido, sin ID, ID inexistente
  y mantenimiento (QA-021).
- [ ] 9.3 `CODEOWNERS` y `dependabot.yml` (npm y github-actions, semanal). Se verifica con la pestaña *Insights →
  Dependency graph → Dependabot* activa (QA-024).
- [ ] 9.4 `scripts/setup-branch-protection.mjs` y su ejecución. Se verifica con un push directo a `main` rechazado y
  un PR con comprobaciones requeridas (QA-020).

## 10. README guiado

- [ ] 10.1 Logo definitivo en `docs/assets/logo.svg`, que se adapta al tema. Se verifica con el README en GitHub en
  tema claro y oscuro (QA-030).
- [ ] 10.2 Párrafo de propósito sin jerga, ruta de la visita numerada (tienda, spec, `.feature`, ejecución de Actions
  e informe) y "Ejecútalo tú" (requisitos previos, `npm run dev`, `npm run qa` y botón de Actions). Se verifica
  siguiendo la ruta de principio a fin y con el comprobador de enlaces en verde (QA-031, QA-033).
- [ ] 10.3 Diagramas Mermaid del ciclo SDD y del pipeline con sus etapas reales. Se verifica con el validador Mermaid
  en verde y la comparación con una ejecución de Actions (QA-032).
- [ ] 10.4 Actualizar `AGENTS.md`: quitar las marcas *(pendiente QAL-001)* de lo ya fijado y documentar los comandos.
  Se verifica con una revisión y el comprobador de enlaces en verde.

## 11. Verificación integrada

- [ ] 11.1 Recorrer los criterios de éxito 1–7 de `proposal.md` y anotar la evidencia de cada uno (enlace a la
  ejecución, captura o comando) en el PR del cambio.

## Workflow follow-up

- Fusionar el PR a `main` sin *squash*.
- `/opsx:archive qal-001-fundacion`: sincronizar specs en `openspec/specs/` y añadir la fila en `openspec/README.md`.
- La carpeta `bocetos/` se archiva con el cambio como registro de la decisión visual.
