# QAL-001 — Fundación del laboratorio

**Estado:** aprobado (2026-10-21) · **Fecha:** 2026-10-21 · **Tipo:** fundacional

## Why

QA Agentic Lab tiene que enseñar, desde cero, a personas que se forman en QA y a clientes cómo se gobierna con especificación un producto y todo su
sistema de calidad, y cómo encaja un equipo de agentes de IA en ese ciclo. Antes de construir la tienda o los agentes
hace falta fijar el suelo común: stack, estructura, pipeline mínimo, reglas de gobierno del repositorio y un portal
donde publicar resultados. Sin esto, cada cambio posterior reinventaría su propio arnés.

## What Changes

- **Stack y estructura** del repositorio para las dos mitades, producto (`app/`) y sistema de calidad (`tests/`,
  `.claude/agents/`, `.github/workflows/`, `portal/`). Se proponen en la sección *Decisiones a validar*.
- **Esqueleto de La Tienda en Casa:** la aplicación arranca, sirve una portada vacía con la marca y expone
  `GET /api/health` y la especificación OpenAPI. Sin funcionalidad de negocio todavía.
- **Arnés de pruebas mínimo,** con un ejemplo de punta a punta de cada pieza:
  - ESLint y comprobación de tipos;
  - un runner de pruebas unitarias;
  - Playwright con Gherkin (playwright-bdd);
  - un escenario `@smoke` de ejemplo trazado a su requisito.
- **Pipeline por etapas en GitHub Actions** (primera versión):
  - análisis estático → arranque de la tienda en el runner → smoke → informe;
  - se lanza en cada PR, en cada push a `main`, de forma manual y de forma programada;
  - con un resumen legible en la propia ejecución.
- **Gobierno del repositorio:**
  - plantilla de PR que exige el ID del cambio QAL;
  - plantillas de *issue* (defecto, requisito);
  - `CODEOWNERS`;
  - protección de `main` (PR obligatorio, pipeline en verde, sin push directo);
  - Dependabot y búsqueda de secretos.
- **Portal de calidad (esqueleto)** publicado en GitHub Pages: portada que explica el laboratorio y enlaza el último
  informe. Solo los resultados de `main` publican; los PR no sobrescriben el portal.

## Capabilities

### New Capabilities

- `quality-pipeline`: etapas del pipeline, disparadores, *quality gates* y resumen de cada ejecución (IDs `QA-0xx`).
- `repo-governance`: reglas de contribución: PR obligatorio, plantillas, trazabilidad del cambio, protección de rama
  y secretos.
- `quality-portal`: qué publica el portal, cuándo y desde qué rama.

Los dominios de la tienda (`catalog`, `cart`, `promotions`, `checkout`, `orders`, `account`) nacen en sus propios
cambios, no aquí.

### Modified Capabilities

Ninguna (proyecto nuevo).

## Decisiones a validar

| # | Decisión | Propuesta | Alternativa | Por qué la propuesta |
|---|---|---|---|---|
| D1 | Framework de la tienda | **Next.js (App Router) + TypeScript + Tailwind**, con la API REST en *route handlers* | Front React (Vite) + API Fastify por separado | Un solo proceso que arrancar en CI. Es el stack que ya dominamos en Pensend |
| D2 | Contrato de la API | **OpenAPI generado desde los esquemas Zod** | OpenAPI escrito a mano | El contrato no puede desviarse del código. El agente de API trabaja sobre él |
| D3 | Datos | **SQLite (libSQL)** con datos de ejemplo deterministas y una entrada de *reset*: fichero local en desarrollo y CI | PostgreSQL en Docker | Sin servicios externos: cualquiera clona y ejecuta. Las pruebas parten siempre del mismo estado |
| D4 | Pago | **Simulado**, con tarjetas ficticias que aprueban o rechazan según el número | Stripe en modo test | Sin cuentas externas, y se pueden diseñar casos de pago a voluntad |
| D5 | Dónde corren las pruebas | **Contra la tienda levantada en el propio runner**, y un smoke posterior contra la demo pública | Solo contra la demo pública | Resultados deterministas. Carga y DAST sin salir de casa |
| D6 | Demo pública | **Vercel (plan Hobby) + Turso** (libSQL gestionado) | Render o Fly.io con SQLite en disco | Despliegue y vista previa por PR sin configurar nada. El uso es formativo y sin ánimo de lucro, compatible con el plan gratuito. Si algún día pasa a uso comercial, se revisa |
| D7 | Gestor de paquetes y Node | **npm** y **Node 24 LTS** | pnpm | Lo mismo que el resto de proyectos |
| D8 | Informes | **Allure** como informe detallado, enlazado desde el portal propio | Solo el informe HTML de Playwright | Ya probado en `poc_QA_E-commerce`. El portal añade la capa ejecutiva y la trazabilidad |
| D9 | Ejecución en local y puertos | **La demo completa también se levanta en local** (`npm run dev` y `npm run build && npm start`) en el **3400**. Las pruebas E2E usan el **3410** y la vista previa del portal el **3420** | Puertos por defecto (3000, 5173) | Son puertos que no han usado otros proyectos (3000, 3100, 3110, 3120, 3150, 3200, 3333, 5173, 54321 están ocupados o reservados). Separar dev y E2E permite tener la tienda abierta mientras corren las pruebas |

## Hoja de ruta propuesta (cambios posteriores)

Cada cambio es una **rebanada vertical**: spec → código de la tienda → Gherkin → pruebas → pipeline → portal. Así cada
uno se puede enseñar entero.

| ID | Cambio | Qué se enseña |
|---|---|---|
| QAL-002 | Catálogo: listado, búsqueda, filtros, orden y detalle | Primer ciclo SDD completo; E2E y API sobre el mismo requisito |
| QAL-003 | Agentes de diseño: Analista, Diseñador y Automatizador | La IA genera Gherkin y tests a partir de las specs, por PR |
| QAL-004 | Carrito, stock y cupones | Valores límite y tablas de decisión diseñados por agentes |
| QAL-005 | Cuenta, checkout con pago simulado y pedidos | Flujo crítico E2E; pruebas de contrato de la API |
| QAL-006 | Pipeline completo: accesibilidad, regresión visual, Lighthouse, ZAP y k6, con sus *quality gates* | Calidad no funcional dentro del ciclo |
| QAL-007 | Agentes de operación: Sanador, Triaje, Auditor y Reportero, más un modo de inyección de defectos | Auto-reparación y triaje en directo, con límites |
| QAL-008 | Portal de calidad: pipeline visual, matriz de trazabilidad, tendencias y resumen ejecutivo | El "wow" para el cliente |

## Valor para la demo

Con este cambio se enseña **el método antes que el producto**:
- el repositorio nace con las reglas escritas (AGENTS.md, OpenSpec, plantillas, protección de rama);
- el primer escenario Gherkin ya está trazado a un requisito y se ve en el informe;
- el pipeline ya tiene forma de etapas.

Tipologías que aparecen: análisis estático y smoke E2E.

## Testing scope

- **Tipologías:** análisis estático (lint, tipos), unitarias (runner preparado), E2E smoke con Gherkin.
- **Riesgo:** bajo. No hay lógica de negocio ni datos reales. El riesgo es de alcance: que la fundación crezca hasta
  hacer de producto.

## Fuera de alcance

- Cualquier funcionalidad de la tienda más allá de la portada y `/api/health`.
- Los agentes de QA (QAL-003 y QAL-007).
- Las tipologías no funcionales: accesibilidad, visual, rendimiento, carga y seguridad (QAL-006).
- El despliegue público, si D6 no se aprueba en este cambio.

## Riesgos

- **Coste de los agentes en CI** (a partir de QAL-003): necesitan `ANTHROPIC_API_KEY` en *GitHub Secrets*. Los PR desde
  forks no reciben secretos, así que nadie externo puede gastarlo, pero hay que acotar cuándo corren.
- **Uso comercial futuro:** el plan Hobby de Vercel no lo cubre. Si el laboratorio pasa a usarse en servicios de pago,
  hay que cambiar de plan o de proveedor (ver D6).
- **Imágenes del catálogo:** deben ser libres de derechos o generadas. Se resuelve en QAL-002.

## Criterios de éxito

1. Repositorio público `tonyfht/qa-agentic-lab` con `main` protegida: no se puede hacer push directo y el PR exige
   el pipeline en verde.
2. Una ejecución del pipeline sobre un PR muestra las etapas por separado y termina en verde. Un PR sin ID QAL en la
   descripción falla la comprobación de gobierno.
3. `npm ci && npm run dev` levanta la tienda en `http://localhost:3400` con datos de ejemplo, sin `.env` obligatorio.
   `npm run build && npm start` sirve la misma demo en modo producción en el mismo puerto, y las pruebas en local
   corren contra el 3410 sin chocar con la tienda abierta.
4. El escenario smoke `@QA-001` aparece en el informe con su ID de requisito.
5. El portal está publicado en GitHub Pages desde `main` y enlaza el último informe. Un PR no lo modifica.

## Impact

Repositorio nuevo. Dependencias nuevas: Next.js, Zod, cliente libSQL, Playwright, playwright-bdd, Vitest, ESLint y
Allure. Servicios: GitHub Actions y GitHub Pages; Vercel y Turso solo si se aprueba D6.
