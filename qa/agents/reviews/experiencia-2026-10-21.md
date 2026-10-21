# Auditoría de experiencia — 2026-10-21

**Agente:** Auditor de experiencia ([`qa-auditor-experiencia`](../../../.claude/agents/qa-auditor-experiencia.md)) ·
**Ejecución:** local, rama `change/qal-006-experiencia` · **Ejecutado por:** Claude Code, sesión del fundador.

**Métricas revisadas:**
- Lighthouse escritorio en portada, catálogo y ficha;
- 9 comprobaciones `@a11y`;
- recorrido con teclado;
- regresión visual;
- prueba de carga.

| # | Hallazgo | Métrica y valor | Impacto para el cliente | Prioridad | Propuesta | Estado |
|---|---|---|---|---|---|---|
| 1 | La tienda no tiene icono: el navegador pide `/favicon.ico` y recibe un 404 | Buenas prácticas 96 en las 3 páginas (auditoría `errors-in-console`) | La pestaña del navegador y los marcadores muestran un icono genérico: la tienda parece menos cuidada. Además, el error ensucia la consola y tapa otros errores reales | Media | Añadir un icono de la tienda | **Corregido en QAL-006** (`app/icon.svg`): buenas prácticas 100 en las 3 páginas |
| 2 | No hay referencias visuales para ningún sistema | 3 comprobaciones `@visual` omitidas | Hoy un cambio de estilo que rompa la portada no lo detecta ninguna prueba | Alta | Generar las referencias en Linux con el workflow "Referencias visuales" e incorporarlas por PR | Pendiente: se hace tras fusionar QAL-006 |
| 3 | La prueba de carga no se ha ejecutado en local | `load` omitida: k6 no está instalado | Sin dato local de cómo responde con 20 personas a la vez. En CI sí se ejecuta | Baja | Instalar k6 (`winget install k6`) para medirla también en local | Informativo |
| 4 | Rendimiento y accesibilidad sin incidencias | Rendimiento 100, accesibilidad 100, SEO 100, LCP 0,43–0,44 s, CLS 0, TBT 0 ms; 0 violaciones WCAG graves en 9 comprobaciones; teclado correcto | Las páginas cargan en menos de medio segundo y se pueden usar con lector de pantalla o solo con teclado | — | Vigilar la tendencia cuando el catálogo crezca (las ilustraciones son SVG en línea) | — |

**Resumen:** 4 hallazgos. Uno corregido en el mismo cambio, uno de prioridad alta que se cierra al incorporar las
referencias visuales y uno informativo. Ningún presupuesto se ha tocado.
