# Design — QAL-003 Agentes de diseño

## Context

Ver `proposal.md`. Hay tres agentes oficiales de Playwright (planner, generator y healer) generados con
`npx playwright init-agents --loop=claude`, con su servidor MCP `playwright-test`. No hay clave de IA en el
repositorio: los agentes se ejecutan desde una sesión de Claude Code (en local) o desde GitHub cuando el fundador
configure la clave.

## Goals / Non-Goals

**Goals:** agentes con límites explícitos, cuyo trabajo comprueban reglas deterministas y cuya actividad se ve en el
informe.

**Non-Goals:** orquestación automática entre agentes (cada uno se invoca por separado y entrega por PR) y agentes de
operación (QAL-008).

## Decisions

### 1. Agentes propios por encima de los de Playwright

`.claude/agents/qa-*.md` son subagentes de Claude Code con *frontmatter* (`name`, `description`, `tools`, `model`) y
un cuerpo con secciones fijas: **Función, Entradas, Salidas, Herramientas, Prohibido, Registro**.
- **Analista y Automatizador** usan las herramientas del servidor MCP `playwright-test`, el mismo que usan planner y
  generator.
- **Los agentes de Playwright** se conservan tal cual. Se regeneran con `init-agents` al actualizar Playwright y se
  documentan como herramientas de base.
- **`.mcp.json`** usa `npx` (multiplataforma). El fichero de semilla del planner vive en `tests/agents/seed.spec.ts`,
  porque `.features-gen/` se regenera.

*Alternativa descartada:* un orquestador propio (LangGraph, scripts con la API). Haría falta construir y mantener lo
que Claude Code y Playwright ya traen, y se perdería la revisión por PR como punto de control natural.

### 2. Comprobaciones deterministas (QA-009, QA-040, QA-043, QA-045)

Son nuevas comprobaciones de la etapa `static`, cada una trazada a su requisito:

| Comprobación | Requisitos | Qué mira |
|---|---|---|
| Calidad de las specs | QA-009 | `openspec validate --specs --strict` (y de los cambios en curso). Cada requisito con ID, `SHALL`/`MUST` y ≥2 escenarios |
| Etiquetado Gherkin | QA-009, QA-043 | Cada escenario con ≥1 ID existente en el catálogo, una tipología, una prioridad. Cada `Scenario Outline` con técnica |
| Definición de agentes | QA-040 | Cada `qa-*.md` con *frontmatter* y las seis secciones |
| Registro de agentes | QA-045 | Cada línea de `qa/agents/actions.ndjson` valida contra su esquema y nombra un agente existente |

El parser de Gherkin es propio y mínimo: líneas de etiquetas, `Feature`, `Scenario`, `Scenario Outline` y
`Examples`. Así no hace falta una dependencia para leer etiquetas.

`openspec` pasa a ser dependencia de desarrollo (`@fission-ai/openspec`) para que CI la tenga.

### 3. Registro de actuaciones

`qa/agents/actions.ndjson` es versionado: una actuación es un hecho del proyecto, como un commit. Cada línea:

```
{ date, agent, change, action, artifacts: string[], summary, executedBy }
```

- **`agent`:** uno de `revisor-specs`, `analista`, `disenador`, `automatizador` (y los de QAL-005/008).
- **`executedBy`:** dice quién lo ejecutó, por ejemplo "Claude Code (sesión del fundador)" o "GitHub Actions".

El ensamblado del resultado copia el registro en `agentActions`. Esto **estrecha** el tipo de `agentActions`, que
pasa de `unknown[]` a un esquema concreto. Los registros anteriores tienen `[]`, así que sigue siendo
`schemaVersion: 1`.

### 4. Informe

Sección *¿Qué ha hecho la IA?*:
- barras horizontales con las actuaciones por agente, en un solo color de marca;
- lista de las 8 últimas actuaciones (fecha, agente, cambio, resumen, artefactos enlazados al repositorio);
- tabla alternativa y estado vacío.

### 5. Workflow `agents.yml`

`workflow_dispatch` con entradas `agente` (lista) y `cambio`.
1. Un paso calcula `has_key` desde `secrets.ANTHROPIC_API_KEY != ''`.
2. Sin clave escribe en el resumen "omitido: falta ANTHROPIC_API_KEY" y termina en verde.
3. Con clave, `anthropics/claude-code-action@v1` recibe un `prompt` que invoca al subagente sobre el cambio y le pide
   abrir un PR.

**Permisos:** `contents: write`, `pull-requests: write`. Las reglas de `main` exigen revisión humana para los PR de
bots (QA-020).

### 6. Primera actuación real

Ejecutadas en esta sesión por Claude Code siguiendo las definiciones y registradas:
1. **Revisor de specs** sobre `catalog`: `qa/agents/reviews/catalog.md`.
2. **Diseñador de casos:** `Scenario Outline` `@pairwise` en `tests/features/catalog/combinaciones.feature`. Combina
   categoría × precio × stock × orden y cubre todas las parejas con 9 filas en lugar de las 54 combinaciones
   completas.
3. **Automatizador:** el *step* genérico "todos los artículos cumplen los filtros", reutilizable.

## Gherkin

```gherkin
@catalog @api @p2 @CAT-003 @CAT-004 @CAT-005 @CAT-006
Feature: Combinaciones de filtros (diseñado por el agente Diseñador de casos)
  @pairwise
  Scenario Outline: Cualquier combinación de filtros devuelve solo artículos que la cumplen
    When pido por la API los artículos con "<consulta>"
    Then la API responde 200
    And todos los artículos cumplen los filtros "<consulta>"
    And la respuesta cumple el contrato publicado
```

## Risks / Trade-offs

- **[El parser de Gherkin propio no cubre toda la sintaxis]** → solo lee etiquetas y tipos de bloque. Lo que no
  entiende lo ignora, y lo verifican sus pruebas con los `.feature` reales.
- **[El registro versionado crece]** → es texto pequeño (una línea por actuación).

## Migration Plan

Etiquetar las dos `Scenario Outline` existentes con su técnica (`@clases-equivalencia` y `@valores-limite`).
