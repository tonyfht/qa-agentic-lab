# QA Agentic Lab — Proyecto

## Visión

Enseñar a un cliente, de principio a fin y con un ejemplo real, cómo se combinan:

- **Gobierno y proceso:** desarrollo dirigido por especificación (SDD con OpenSpec), trazabilidad requisito → prueba →
  resultado → defecto, *quality gates* y revisión humana.
- **Herramientas:** automatización de pruebas de todas las tipologías en un pipeline de CI por etapas.
- **IA:** un equipo de agentes de QA que diseña, automatiza, repara, clasifica e informa, con límites explícitos.

El resultado se ve en un **portal de calidad** público y se puede ejecutar cuantas veces se quiera en GitHub Actions.

## Decisiones cerradas

| Fecha | Decisión |
|---|---|
| 2026-10-21 | Proyecto nuevo y público, separado de `poc_QA_E-commerce` (que queda como referencia anterior). |
| 2026-10-21 | Nombre: **QA Agentic Lab** (`qa-agentic-lab`). |
| 2026-10-21 | Aplicación propia y no pública de terceros: permite SDD de punta a punta, API, carga y DAST sobre sistemas propios, y demos controladas de reparación y triaje. |
| 2026-10-21 | Caso de uso: e-commerce de artículos para el hogar, **La Tienda en Casa**, con catálogo, búsqueda y filtros. |
| 2026-10-21 | Producto y sistema de calidad en un único repositorio, ambos gobernados por OpenSpec. |

## Decisiones abiertas

Se resuelven en `QAL-001` (ver su `proposal.md`).
