# OpenSpec — QA Agentic Lab

Este directorio gobierna el desarrollo de la tienda y del sistema de calidad con SDD (Spec-Driven Development) y
[OpenSpec](https://github.com/Fission-AI/OpenSpec).

## Referencias

- [`PROJECT.md`](PROJECT.md): visión, requisitos transversales, mapa de IA por fase, hoja de ruta y decisiones
  cerradas. Es la propuesta global del proyecto.
- [`config.yaml`](config.yaml): contexto y reglas por artefacto que aplica OpenSpec.
- [`specs/`](specs/): fuente de verdad por dominio (se construye con `/opsx:sync` al archivar).
- [`changes/`](changes/): cambios en curso; [`changes/archive/`](changes/archive/): cambios cerrados.

## Convención de IDs

`QAL-XXX-nombre-descriptivo` (**Q**A **A**gentic **L**ab, 3 dígitos, kebab-case). En el archivo, OpenSpec antepone la
fecha: `AAAA-MM-DD-qal-XXX-nombre/`.

**Siguiente ID libre: `QAL-010`.**

## Estructura de un cambio

```
QAL-XXX-nombre/
  proposal.md          → problema, solución, alternativas, valor para la demo, criterios de éxito
  specs/<dominio>/
    spec.md            → delta spec: ADDED / MODIFIED / REMOVED (RFC 2119 + GIVEN/WHEN/THEN, con IDs)
  design.md            → arquitectura, decisiones, sección Gherkin y tipologías por requisito
  tasks.md             → tareas con sección Testing
```

## Cambios en curso

| ID | Nombre | Estado |
|----|--------|--------|
| — | Ninguno | — |

## Cambios archivados

| ID | Nombre | Fecha | Tipo |
|----|--------|-------|------|
| [QAL-001](changes/archive/2026-10-21-qal-001-fundacion/) | Fundación del laboratorio: arnés, pipeline con paridad local/CI, resultados e histórico, informe propio, README guiado y gobierno | 2026-10-21 | Fundacional |
| [QAL-002](changes/archive/2026-10-21-qal-002-catalogo/) | Catálogo: búsqueda, filtros, ficha de producto y API con contrato | 2026-10-21 | Producto |
| [QAL-003](changes/archive/2026-10-21-qal-003-agentes-diseno/) | Agentes de diseño: revisor, analista, diseñador y automatizador, con comprobaciones deterministas y registro | 2026-10-21 | Calidad + IA |
| [QAL-004](changes/archive/2026-10-21-qal-004-carrito-cupones/) | Carrito, stock y cupones, diseñado por los agentes (tabla de decisión, valores límite) | 2026-10-21 | Producto |
| [QAL-005](changes/archive/2026-10-21-qal-005-checkout-pedidos/) | Cuenta, checkout con pago simulado, pedidos atómicos y agente de API con barrido de contrato | 2026-10-21 | Producto + IA |
| [QAL-006](changes/archive/2026-10-21-qal-006-experiencia/) | Experiencia: accesibilidad, regresión visual, rendimiento (Lighthouse) y carga (k6), con auditor de experiencia | 2026-10-21 | Calidad no funcional + IA |
| [QAL-007](changes/archive/2026-10-21-qal-007-seguridad-cumplimiento/) | Seguridad y cumplimiento: cabeceras, SAST, dependencias, licencias, SBOM y DAST, con auditor de seguridad | 2026-10-21 | Seguridad + cumplimiento + IA |
| [QAL-008](changes/archive/2026-10-21-qal-008-agentes-operacion/) | Agentes de operación: triaje, Detector de inestables, cuarentena con caducidad, Sanador con guardia de aserciones e inyección de defectos | 2026-10-21 | Operación de la suite + IA |
| [QAL-009](changes/archive/2026-10-21-qal-009-informe-completo/) | Informe completo: ¿Podemos salir? con recomendación determinista, huecos por capacidad, Reportero y guía final | 2026-10-21 | Informe + IA + guía |
