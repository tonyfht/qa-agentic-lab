# Auditoría de seguridad y cumplimiento — 2026-10-21

**Agente:** Auditor de seguridad y cumplimiento ([definición](../../../.claude/agents/qa-auditor-seguridad.md)).
**Ejecución auditada:** primera ejecución de la etapa "5 · Seguridad y cumplimiento" en GitHub Actions, rama
`change/qal-007-seguridad-cumplimiento` (run 39635491606).
**Ejecutado por:** Claude Code (sesión del fundador, QAL-007).

## Resultado de la ejecución

| Control | Resultado | Bloqueaba |
|---|---|---|
| SAST (Semgrep `p/default`) | 3 altos, 31 medios, 3 bajos | Sí: 3 `spawn-shell-true` |
| Dependencias (npm audit) | 6 altos, todos de desarrollo | No |
| Licencias de producción | 44 paquetes; 1 LGPL aceptada (`@img/sharp-*`) | No |
| SBOM CycloneDX | 44 componentes | — |
| DAST (OWASP ZAP baseline) | 2 medios, 3 bajos, 4 informativos | Sí: 2 CSP `unsafe-inline` |

## Hallazgos priorizados por riesgo real

Tres preguntas para cada uno: **¿se distribuye?** (producción frente a desarrollo), **¿es alcanzable desde fuera?** y
**¿toca datos personales o dinero?**

| # | Hallazgo | Fuente | Riesgo real | Prioridad | Propuesta | Estado |
|---|---|---|---|---|---|---|
| 1 | *Information Disclosure — Sensitive Information in URL* (10024): el formulario de entrar acabó con `password` en la URL | ZAP (info) | **Alto aunque ZAP lo marque informativo.** Se distribuye, es público y toca credenciales y tarjetas. Los formularios de entrar, registro y pago no tenían `method`: si se envían antes de que cargue JavaScript, el navegador hace `GET` con los datos en la URL, el historial y los registros | **P1** | `method="post"` en los tres formularios y requisito nuevo SEC-005 con sus escenarios | Corregido |
| 2 | `spawn-shell-true` en `qa/lib/exec.ts` (×3) | Semgrep (alto) | Bajo. No se distribuye: es el orquestador de QA. Los comandos son literales del propio código, sin entrada externa | P3 | `commandExists` ya no usa shell. Los otros dos necesitan shell para resolver `npx` (`.cmd` en Windows): excepción `nosemgrep` con su motivo | Corregido y aceptado |
| 3 | CSP `script-src 'unsafe-inline'` (10055) | ZAP (medio) | Medio-bajo. Público, pero React escapa todo el contenido y ningún dato del usuario se pinta como HTML. La CSP solo admite `'self'` y `object-src 'none'` | P2 | Aceptada con motivo en `compliance/zap-aceptadas.json`. **Mejora propuesta:** *nonce* por petición desde `proxy.ts` cuando el coste en caché estática merezca la pena | Aceptado |
| 4 | CSP `style-src 'unsafe-inline'` (10055) | ZAP (medio) | Bajo: los estilos en línea no ejecutan código | P3 | Aceptada con motivo | Aceptado |
| 5 | Cabeceras COOP, CORP y COEP ausentes (90004) | ZAP (bajo) | Bajo. La tienda no carga nada de otros orígenes, así que el aislamiento sale gratis | P3 | `same-origin` en COOP y CORP y `require-corp` en COEP; SEC-001 las exige | Corregido |
| 6 | Acciones de GitHub con etiqueta mutable (×27) | Semgrep (medio) | Medio. Cadena de suministro: quien controle la etiqueta ejecuta código en el pipeline | P2 | Fijadas a SHA con comentario de versión; Dependabot las mantiene | Corregido |
| 7 | Dependabot sin *cooldown* y `.npmrc` sin `min-release-age` | Semgrep (bajo) | Bajo-medio. Una versión maliciosa recién publicada entraría en la propuesta semanal | P3 | `cooldown: 7` días por ecosistema y `min-release-age=7` | Corregido |
| 8 | `RegExp` construida con datos (`findings.ts`, `governance.ts`) | Semgrep (medio) | Bajo: los datos son del repositorio, no del usuario | P3 | Comparación sin expresiones regulares dinámicas, con prueba unitaria | Corregido |
| 9 | `braces`, `micromatch`, `fast-glob`, `eslint-config-next` y `@fission-ai/openspec` vulnerables | npm audit (alto) | Bajo: solo desarrollo, no llegan a la tienda | P3 | Esperar a que Dependabot proponga versiones corregidas. No se fuerza `overrides` sin probar | Abierto, vigilado |
| 10 | *User Controllable HTML Element Attribute* (10031) en `/catalogo?category=` | ZAP (info) | Bajo: solo se acepta una categoría existente (`parseCatalogQuery`) y React escapa el valor | — | Ninguna; los escenarios de catálogo ya cubren valores inválidos | Revisado |
| 11 | *Non-Storable Content* (10049) y *Authentication Request Identified* (10111) | ZAP (info) | Ninguno: es el comportamiento esperado de páginas con sesión | — | Ninguna | Revisado |

## Excepciones vigentes

| Excepción | Motivo | ¿Sigue siendo cierta? |
|---|---|---|
| `@img/sharp-*` LGPL-3.0 (`compliance/licencias.json`) | libvips se enlaza dinámicamente y no se modifica | Sí |
| ZAP 10055 *script-src* y *style-src* | Next.js emite scripts y estilos en línea | Sí; revisar en cada versión mayor de Next.js |
| `nosemgrep` en `qa/lib/exec.ts` (×2) | Comandos literales del orquestador | Sí, mientras ningún comando incluya entrada externa |

## Recomendación

Con los cambios de esta auditoría, la etapa no tiene hallazgos bloqueantes. El hallazgo 1 es el ejemplo de por qué
la gravedad de la herramienta no basta: ZAP lo marcó informativo y era el único que exponía credenciales.
