# QA Agentic Lab — Proyecto

Visión, requisitos transversales y hoja de ruta global. Cada cambio `QAL-XXX` concreta una parte de este documento. Si
un cambio contradice lo que hay aquí, primero se actualiza este documento.

## Visión

**Otra forma de hacer QA.** No es la QA tradicional, manual y al final del ciclo. Tampoco es "solo automatización". Es
una QA **apoyada en la IA en todo el ciclo de vida del software**:

- requisitos;
- diseño y automatización de pruebas;
- ejecución y mantenimiento;
- seguridad y cumplimiento;
- informe y decisión de salida.

Todo dentro de un proceso gobernado por especificación.

El laboratorio lo enseña con un ejemplo real y completo:

- **Proceso y gobierno:** SDD con OpenSpec, trazabilidad requisito → prueba → resultado → defecto, *quality gates* y
  revisión humana de todo cambio.
- **Herramientas:** todas las tipologías de prueba que tengan sentido, en un pipeline por etapas que se ejecuta
  **igual en local y en GitHub Actions**.
- **IA:** un equipo de agentes de QA, *skills* y servidores MCP que trabajan en cada fase, con límites explícitos.

Es un proyecto **formativo y sin ánimo de lucro**, dirigido a personas que no saben de QA y también a clientes. Todo
lo visible se tiene que entender sin conocimientos previos.

## Requisitos transversales

Aplican a todos los cambios. Un cambio que los incumpla no se archiva.

### RT-1 · La tienda tiene volumen suficiente para todas las tipologías

La Tienda en Casa es pequeña, pero cada funcionalidad se elige porque permite enseñar una técnica o tipología de prueba
concreta. Por ejemplo:

| Funcionalidad | Qué permite enseñar |
|---|---|
| Búsqueda y filtros | Clases de equivalencia y *pairwise* |
| Cupones y envío gratis | Valores límite y tablas de decisión |
| Stock limitado | Concurrencia y carga |
| Pago simulado | Casos negativos y de contrato |
| Cuenta de usuario | Seguridad y privacidad |
| Formularios | Accesibilidad |

### RT-2 · Paridad local / CI

Cada etapa del pipeline es un script de `npm`. GitHub Actions solo llama a esos scripts, nunca tiene lógica propia. Así:

- `npm run qa` ejecuta en local las mismas etapas que CI;
- se generan los mismos resultados y el mismo informe;
- `npm run qa -- --stage <etapa>` ejecuta una sola etapa.

Lo que necesite servicios que no hay en local (el despliegue público, la clave de la IA) se salta con aviso explícito y
nunca en silencio.

### RT-3 · Informe propio con histórico

El informe de calidad es un **desarrollo propio**: un sitio estático y muy visual, construido a partir de un formato de
resultados común a todas las tipologías.

- **Resultado de cada ejecución:** un JSON con un esquema versionado. Recoge etapas, tests, IDs de requisito,
  métricas no funcionales, hallazgos de seguridad y actuaciones de los agentes.
- **Histórico:** cada ejecución añade una línea a `history/runs.ndjson`.
  - En CI vive en la rama `gh-pages` y solo lo actualizan las ejecuciones de `main`.
  - En local vive en `reports/` (no se versiona).
- **El mismo generador** (`npm run report`) construye el informe en local (vista previa en el puerto 3420) y en
  GitHub Pages.
- **Cada gráfico responde a una pregunta concreta**, escrita junto al gráfico. Ninguno es decorativo.
  - ¿Estamos mejor o peor que antes? Tendencia por ejecución.
  - ¿Qué requisitos están cubiertos y cuáles fallan? Matriz de trazabilidad.
  - ¿Dónde se va el tiempo del pipeline? Duración por etapa.
  - ¿Qué ha hecho la IA? Tests diseñados, reparados y defectos abiertos por los agentes.
  - ¿Es estable la suite? Tasa de *flaky*.
  - ¿Cómo evolucionan accesibilidad, rendimiento y seguridad? Una serie por métrica.
- El informe técnico de Playwright (trazas, vídeos) queda como detalle enlazado desde cada test.

### RT-4 · README guiado

El README es la puerta de entrada y tiene que poder seguirse sin ayuda:

- **Logo** de QA Agentic Lab.
- **Ruta de la visita:** un índice numerado del tipo "1. mira esto → verás esto; 2. ...". Cada paso enlaza a lo que hay
  que abrir (la tienda, una spec, un `.feature`, una ejecución de Actions, el informe) y dice qué se debe ver.
- **Diagramas:** el flujo de CI/CD con sus etapas, la arquitectura de los agentes y el ciclo SDD.
  - En Mermaid, que GitHub muestra como imagen y que se puede versionar y revisar en un PR.
  - En SVG propio donde Mermaid se quede corto.
- **"Ejecútalo tú":** en local con un solo comando, y en GitHub Actions con un botón (lanzamiento manual).
- El README crece con cada cambio. Cada cambio que añada algo visible añade su paso a la ruta y actualiza sus
  diagramas.

### RT-5 · IA en todo el ciclo, con herramientas de mercado

Cada fase del ciclo de vida tiene al menos una pieza de IA. Se prefieren herramientas existentes antes que desarrollos
propios: agentes, *skills* y servidores MCP. La regla de gobierno se mantiene siempre: **la IA propone, las pruebas y
las personas deciden.**

## Mapa de IA por fase del ciclo

| Fase | Agente | Herramientas de IA | Herramientas deterministas |
|---|---|---|---|
| Requisitos | **Revisor de specs**: ambigüedad, testabilidad, huecos | Skills de OpenSpec | `openspec validate` |
| Diseño de pruebas | **Analista** y **Diseñador de casos** | Playwright MCP (explorar la tienda), *planner* de Playwright Test Agents | — |
| Automatización | **Automatizador** y **Agente de API** | *generator* de Playwright Test Agents, especificación OpenAPI | Playwright, playwright-bdd, Vitest |
| Ejecución | — | — | GitHub Actions, pipeline por etapas |
| Mantenimiento | **Sanador** y **Detector de inestables** | *healer* de Playwright Test Agents, Playwright MCP | Reintentos, histórico, cuarentena con caducidad y guardia de aserciones |
| No funcional | **Auditor de experiencia**: accesibilidad, rendimiento, visual | — | axe, Lighthouse CI, comparación visual, k6 |
| Seguridad y cumplimiento | **Auditor de seguridad y cumplimiento** | — | Semgrep, `npm audit`, SBOM, licencias, Gitleaks, OWASP ZAP |
| Defectos | **Triaje**: decide de quién es cada fallo y abre *issues* con evidencia | GitHub MCP | Reglas de triaje, GitHub Issues |
| Informe y salida | **Reportero**: compara con el histórico, resumen ejecutivo, recomendación de salida | — | Informe propio, *quality gates* |

Los agentes son subagentes de Claude Code versionados en `.claude/agents/`. Se ejecutan en local o en CI con la GitHub
Action de Claude Code. Las herramientas de pago del mercado (Applitools, Mabl, Testim, Snyk...) aparecen en la
documentación como comparación, no como dependencia.

## Hoja de ruta

Cada cambio es una **rebanada vertical**: spec → código → Gherkin → pruebas → pipeline → informe → README. Así cada uno
se puede enseñar entero.

| ID | Cambio | Qué se enseña | Estado |
|---|---|---|---|
| QAL-001 | Fundación: arnés, pipeline con paridad local/CI, formato de resultados e histórico, informe mínimo, README guiado con logo, gobierno del repositorio | El método antes que el producto | ✔ Hecho |
| QAL-002 | Catálogo: listado, búsqueda, filtros, orden y detalle | Primer ciclo SDD completo; E2E y API sobre el mismo requisito | ✔ Hecho |
| QAL-003 | Agentes de diseño: Revisor de specs, Analista, Diseñador y Automatizador | La IA revisa requisitos y genera Gherkin y tests, por PR | ✔ Hecho |
| QAL-004 | Carrito, stock y cupones | Valores límite y tablas de decisión diseñados por agentes | ✔ Hecho |
| QAL-005 | Cuenta, checkout con pago simulado y pedidos; Agente de API | Flujo crítico E2E; contrato de la API | ✔ Hecho |
| QAL-006 | Experiencia: accesibilidad, regresión visual, rendimiento y carga; Auditor de experiencia | Calidad no funcional con *quality gates* | ✔ Hecho |
| QAL-007 | Seguridad y cumplimiento: SAST, dependencias, SBOM, licencias, secretos, DAST; Auditor de seguridad y cumplimiento | *Shift-left* de seguridad y evidencias de cumplimiento | ✔ Hecho |
| QAL-008 | Agentes de operación: Sanador, Detector de inestables y Triaje, con modo de inyección de defectos | Auto-reparación y triaje en directo, con límites | ✔ Hecho |
| QAL-009 | Informe completo: Reportero, resumen ejecutivo, recomendación de salida y todos los gráficos | El "wow" final | ✔ Hecho |
| QAL-010 | La Tienda en Casa, de maqueta a tienda: identidad, fotos reales con crédito y mejoras de UX | Un rediseño grande con el mismo método: la suite anterior en verde sin tocar aserciones | ✔ Hecho |
| QAL-011 | Los agentes de QA, en el flujo: página interactiva y presentaciones | Dónde actúa cada agente en el ciclo, de un vistazo | ✔ Hecho |

## Decisiones cerradas

| Fecha | Decisión |
|---|---|
| 2026-10-21 | Proyecto nuevo y público, separado de `poc_QA_E-commerce` (que queda como referencia anterior). |
| 2026-10-21 | Nombre: **QA Agentic Lab** (`qa-agentic-lab`). |
| 2026-10-21 | Aplicación propia y no pública de terceros: permite SDD de punta a punta, API, carga y DAST sobre sistemas propios, y demos controladas de reparación y triaje. |
| 2026-10-21 | Caso de uso: e-commerce de artículos para el hogar, **La Tienda en Casa**, con catálogo, búsqueda y filtros. |
| 2026-10-21 | Producto y sistema de calidad en un único repositorio, ambos gobernados por OpenSpec. |
| 2026-10-21 | Uso formativo y sin ánimo de lucro: la demo pública puede ir en el plan gratuito de Vercel. Se difundirá también desde antonioherrera.tech. |
| 2026-10-21 | La demo completa se levanta también en local (puertos 3400, 3410 y 3420). |
| 2026-10-21 | Identidad visual: logo **escudo** (el check del escudo está hecho de agentes conectados), índigo `#4f46e5` + verde azulado `#0d9488`, y la dirección del informe de `qal-001-fundacion/bocetos/informe.html`. |
| 2026-10-21 | Requisitos transversales RT-1 a RT-5: volumen para todas las tipologías, paridad local/CI, informe propio con histórico, README guiado e IA en todo el ciclo. |
