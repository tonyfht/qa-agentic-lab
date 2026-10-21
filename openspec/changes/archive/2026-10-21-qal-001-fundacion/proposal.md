# QAL-001 — Fundación del laboratorio

**Estado:** aprobado (revisión 2, 2026-10-21) · **Fecha:** 2026-10-21 · **Tipo:** fundacional

Este cambio concreta la base de [`openspec/PROJECT.md`](../../../PROJECT.md): visión, requisitos transversales RT-1 a RT-5
y hoja de ruta.

## Why

QA Agentic Lab tiene que enseñar, desde cero, a personas que se forman en QA y a clientes, cómo se hace QA apoyada en
IA dentro de un ciclo de vida gobernado por especificación.

Antes de construir la tienda o los agentes hay que fijar el suelo común:
- stack y estructura;
- un pipeline que funcione igual en local y en GitHub Actions;
- un formato de resultados con histórico y su informe;
- un README que guíe la visita;
- las reglas de gobierno del repositorio.

Si esto no existe desde la primera ejecución, el histórico nace incompleto y cada cambio reinventa su arnés.

## What Changes

- **Stack y estructura** de las dos mitades: producto (`app/`) y sistema de calidad (`tests/`, `.claude/agents/`,
  `.github/workflows/`, `report/`). Ver *Decisiones a validar*.
- **Esqueleto de La Tienda en Casa:**
  - arranca y sirve una portada con la marca;
  - expone `GET /api/health` y la especificación OpenAPI;
  - todavía sin funcionalidad de negocio.
- **Arnés de pruebas mínimo,** con un ejemplo de punta a punta:
  - ESLint y comprobación de tipos;
  - runner de pruebas unitarias;
  - Playwright con Gherkin (playwright-bdd);
  - un escenario `@smoke` trazado a su requisito.
- **Pipeline por etapas con paridad local/CI (RT-2):**
  - cada etapa es un script de npm, y `npm run qa` las ejecuta todas en local;
  - GitHub Actions llama a los mismos scripts, y cada etapa es un *job* visible: análisis estático → tienda en el
    runner → smoke → informe;
  - se lanza en cada PR, en cada push a `main`, a mano (con un botón) y de forma programada.
- **Formato de resultados e histórico (RT-3):**
  - esquema JSON versionado del resultado de una ejecución (etapas, tests, IDs de requisito y huecos ya previstos
    para métricas, hallazgos y actuaciones de agentes);
  - cada ejecución añade su línea a `history/runs.ndjson`.
- **Informe propio, primera versión (RT-3):**
  - un generador (`npm run report`) construye un sitio estático con tres gráficos, cada uno con la pregunta que
    responde: tendencia por ejecución, duración por etapa y requisitos cubiertos;
  - se ve igual en local (puerto 3420) y en GitHub Pages;
  - solo las ejecuciones de `main` publican y alimentan el histórico público.
- **README guiado (RT-4):**
  - logo de QA Agentic Lab;
  - ruta de la visita numerada, con los pasos que ya existen tras este cambio;
  - diagramas en Mermaid del ciclo SDD y del pipeline;
  - sección "Ejecútalo tú", en local y en Actions.
- **Gobierno del repositorio:**
  - plantilla de PR que exige el ID QAL, y una comprobación automática de que lo lleva;
  - plantillas de *issue* (defecto, requisito);
  - `CODEOWNERS`;
  - protección de `main`;
  - Dependabot y búsqueda de secretos;
  - `.gitattributes` para fijar los saltos de línea.

## Capabilities

### New Capabilities

- `quality-pipeline`: etapas, disparadores, paridad local/CI, *quality gates* y resumen de cada ejecución (IDs
  `QA-0xx`).
- `quality-report`: formato de resultados, histórico acumulado, generación y publicación del informe, y gráficos con
  su pregunta.
- `repo-governance`: PR obligatorio, plantillas, comprobación del ID del cambio, protección de rama y secretos.
- `lab-guide`: contenido mínimo del README (logo, ruta de la visita, diagramas, "Ejecútalo tú") y obligación de
  mantenerlo con cada cambio.

Los dominios de la tienda (`catalog`, `cart`, `promotions`, `checkout`, `orders`, `account`) nacen en sus propios
cambios.

### Modified Capabilities

Ninguna (proyecto nuevo).

## Decisiones a validar

D1–D7 y D9 están validadas en la revisión 1. D8 cambia, y D10–D12 son nuevas.

| # | Decisión | Propuesta | Alternativa | Por qué la propuesta |
|---|---|---|---|---|
| D1 | Framework de la tienda | **Next.js (App Router) + TypeScript + Tailwind**, con la API REST en *route handlers* | Front React (Vite) + API Fastify por separado | Un solo proceso que arrancar en CI. Es el stack que ya dominamos en Pensend |
| D2 | Contrato de la API | **OpenAPI generado desde los esquemas Zod** | OpenAPI escrito a mano | El contrato no puede desviarse del código. El agente de API trabaja sobre él |
| D3 | Datos | **SQLite (libSQL)** con datos de ejemplo deterministas y una entrada de *reset*: fichero local en desarrollo y CI | PostgreSQL en Docker | Sin servicios externos: cualquiera clona y ejecuta. Las pruebas parten siempre del mismo estado |
| D4 | Pago | **Simulado**, con tarjetas ficticias que aprueban o rechazan según el número | Stripe en modo test | Sin cuentas externas, y se pueden diseñar casos de pago a voluntad |
| D5 | Dónde corren las pruebas | **Contra la tienda levantada en el propio runner**, y un smoke posterior contra la demo pública | Solo contra la demo pública | Resultados deterministas. Carga y DAST sin salir de casa |
| D6 | Demo pública | **Vercel (plan Hobby) + Turso** (libSQL gestionado) | Render o Fly.io con SQLite en disco | Despliegue y vista previa por PR sin configurar nada. El uso es formativo y sin ánimo de lucro, compatible con el plan gratuito. Si algún día pasa a uso comercial, se revisa |
| D7 | Gestor de paquetes y Node | **npm** y **Node 24 LTS** | pnpm | Lo mismo que el resto de proyectos |
| D8 | Informe | **Informe propio** generado desde el formato de resultados; el HTML de Playwright queda como detalle técnico enlazado desde cada test. **Sin Allure** | Allure como informe principal | Allure no conoce nuestra trazabilidad, ni las métricas no funcionales, ni lo que hacen los agentes. Su histórico es opaco. Un informe propio cuenta exactamente la historia que queremos y en español |
| D9 | Ejecución en local y puertos | **La demo completa también se levanta en local** (`npm run dev` y `npm run build && npm start`) en el **3400**. Las pruebas E2E usan el **3410** y la vista previa del informe el **3420** | Puertos por defecto (3000, 5173) | Son puertos que no han usado otros proyectos (3000, 3100, 3110, 3120, 3150, 3200, 3333, 5173, 54321 están ocupados o reservados). Separar dev y E2E permite tener la tienda abierta mientras corren las pruebas |
| D10 | Tecnología del informe | **Generador en TypeScript que produce HTML estático, con Apache ECharts empaquetado** (sin CDN) | Astro o Next.js exportado; Grafana | Sin servidor ni base de datos: se abre igual desde disco, en local o en Pages. ECharts da gráficos ricos e interactivos con poco código |
| D11 | Dónde se guarda el histórico | **`history/runs.ndjson` en la rama `gh-pages`**, actualizado solo por `main`, con un grupo de concurrencia para que dos ejecuciones no se pisen. En local, en `reports/` | Artefactos de Actions (caducan); una base de datos externa | Se publica junto al informe sin servicios extra. Es un fichero legible y auditable, y no caduca |
| D12 | Diagramas del README | **Mermaid** para los flujos (ciclo SDD, pipeline, agentes) y **SVG propio** para el logo | Imágenes PNG exportadas de una herramienta de dibujo | GitHub muestra Mermaid como imagen. Se versiona y se revisa en un PR como el código, así que nunca se queda desactualizado sin que se note |

**Dirección visual del logo y del informe:** se propone en el `design.md` con bocetos y se confirma antes de
implementarla.

## Valor para la demo

Con este cambio se enseña **el método antes que el producto**:
- el repositorio nace con sus reglas escritas;
- el README guía la visita desde el primer día;
- el pipeline ya tiene forma de etapas y se ejecuta igual en un portátil que en GitHub;
- **el histórico empieza a contar desde la primera ejecución**.

Tipologías que aparecen: análisis estático y smoke E2E.

## Testing scope

- **Tipologías:** análisis estático (lint, tipos), unitarias (generador del informe y validación del esquema de
  resultados) y E2E smoke con Gherkin.
- **Riesgo:** medio. El formato de resultados es un contrato del que dependerán todos los cambios posteriores: si nace
  mal, habrá que migrar el histórico. Por eso va versionado desde la v1.

## Fuera de alcance

- Cualquier funcionalidad de la tienda más allá de la portada y `/api/health`.
- Los agentes de QA (desde QAL-003).
- Las tipologías no funcionales y de seguridad (QAL-006 y QAL-007).
- Los gráficos que dependen de datos que aún no existen (agentes, métricas no funcionales, seguridad). El formato
  reserva su sitio, pero el informe no los pinta vacíos.
- El despliegue público en Vercel (se activa cuando haya tienda que enseñar, en QAL-002).

## Riesgos

- **Esquema de resultados inmaduro:** ver *Testing scope*. Mitigación: versión en cada registro (`schemaVersion`) y
  un lector que tolere versiones anteriores.
- **Escrituras concurrentes del histórico:** se evitan con el grupo de concurrencia de D11.
- **Coste de los agentes en CI** (desde QAL-003): necesitan `ANTHROPIC_API_KEY` en *GitHub Secrets*. Los PR desde
  forks no reciben secretos, así que nadie externo puede gastarlo, pero hay que acotar cuándo corren.
- **Uso comercial futuro:** el plan Hobby de Vercel no lo cubre (ver D6).

## Criterios de éxito

1. Repositorio público `tonyfht/qa-agentic-lab` con `main` protegida: no se puede hacer push directo y el PR exige
   el pipeline en verde.
2. Un PR muestra las etapas del pipeline como *jobs* separados y termina en verde. Un PR sin ID QAL falla la
   comprobación de gobierno.
3. `npm ci && npm run dev` levanta la tienda en `http://localhost:3400` sin `.env` obligatorio. `npm run build &&
   npm start` la sirve en modo producción en el mismo puerto.
4. `npm run qa` ejecuta en local las mismas etapas que CI y produce un resultado JSON que valida contra el esquema.
5. Tras dos ejecuciones en `main`, el informe publicado en GitHub Pages muestra dos puntos en la tendencia. El
   escenario `@QA-001` aparece en la vista de requisitos. `npm run report` muestra lo mismo en `http://localhost:3420`
   con el histórico local.
6. Un PR no modifica ni el informe publicado ni el histórico.
7. El README se entiende sin ayuda: tiene el logo, una ruta de la visita cuyos pasos funcionan todos, los diagramas
   del ciclo SDD y del pipeline, y "Ejecútalo tú".

## Impact

Repositorio nuevo. Dependencias nuevas: Next.js, Zod, cliente libSQL, Playwright, playwright-bdd, Vitest, ESLint y
Apache ECharts. Servicios: GitHub Actions y GitHub Pages.
