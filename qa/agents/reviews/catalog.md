# Revisión de la spec `catalog`

**Agente:** Revisor de specs ([`qa-revisor-specs`](../../../.claude/agents/qa-revisor-specs.md)) ·
**Fecha:** 2026-10-21 · **Spec:** [`openspec/specs/catalog/spec.md`](../../../openspec/specs/catalog/spec.md) ·
**Ejecutado por:** Claude Code, sesión del fundador (QAL-003).

`openspec validate --specs --strict` pasa. Los 9 requisitos tienen ID, lenguaje normativo y al menos un escenario de
error o límite. Hallazgos para que una persona decida. **Esta revisión no modifica la spec.**

| # | Requisito | Tipo | Gravedad | Qué dice | Propuesta |
|---|---|---|---|---|---|
| 1 | CAT-006 | Comprobabilidad | Media | "Relevancia (orden por defecto)" no define qué es la relevancia, así que ninguna prueba puede afirmar el orden por defecto | Especificar: coincidencia en el nombre antes que en la descripción; sin búsqueda, novedades primero y después por nombre (es lo que hace el código) |
| 2 | CAT-009 | Comprobabilidad | Media | "El mismo orden" depende de cómo se desempatan artículos con el mismo precio o valoración, y la spec no lo dice | Añadir: los empates se resuelven por nombre |
| 3 | CAT-001 | Falta escenario | Media | Cubre la página fuera de rango, pero no `page=0` ni `page=abc` | Añadir escenario: una página no válida responde 400 en la API y avisa en la interfaz |
| 4 | CAT-003 | Ambigüedad | Baja | "Cuántos artículos tiene cada una": ¿incluye los agotados? | Precisar que el contador incluye todos los artículos de la categoría |
| 5 | CAT-004 | Ambigüedad | Baja | No dice qué formatos de precio se aceptan (coma, punto, decimales) | Precisar: euros con coma o punto y hasta dos decimales; más decimales es un error |
| 6 | CAT-007 | Ambigüedad | Baja | "Valoración" sin escala ni formato | Precisar: de 0 a 5, con un decimal |

**Resumen:** 6 hallazgos (3 medios, 3 bajos). Ninguno bloquea las pruebas actuales. Los hallazgos 1 a 3 harían que
algunos comportamientos que hoy solo prueba el código (unitarias) pasaran a estar especificados.
