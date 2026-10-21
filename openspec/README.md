# OpenSpec — QA Agentic Lab

Este directorio gobierna el desarrollo de la tienda y del sistema de calidad con SDD (Spec-Driven Development) y
[OpenSpec](https://github.com/Fission-AI/OpenSpec).

## Referencias

- [`PROJECT.md`](PROJECT.md): visión, decisiones cerradas y decisiones abiertas.
- [`config.yaml`](config.yaml): contexto y reglas por artefacto que aplica OpenSpec.
- [`specs/`](specs/): fuente de verdad por dominio (se construye con `/opsx:sync` al archivar).
- [`changes/`](changes/): cambios en curso; [`changes/archive/`](changes/archive/): cambios cerrados.

## Convención de IDs

`QAL-XXX-nombre-descriptivo` (**Q**A **A**gentic **L**ab, 3 dígitos, kebab-case). En el archivo, OpenSpec antepone la
fecha: `AAAA-MM-DD-qal-XXX-nombre/`.

**Siguiente ID libre: `QAL-002`.**

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
| [QAL-001](changes/qal-001-fundacion/) | Fundación del laboratorio | borrador |

## Cambios archivados

| ID | Nombre | Fecha | Tipo |
|----|--------|-------|------|
