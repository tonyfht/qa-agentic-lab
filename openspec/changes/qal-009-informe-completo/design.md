# Design — QAL-009 Informe completo

## Context

Ver `proposal.md` y los requisitos QA-036…038 y QA-055.

Todos los datos necesarios ya están en el resultado de la ejecución:
- etapas;
- tests con su triaje;
- requisitos con su capacidad;
- hallazgos;
- métricas de Lighthouse;
- defecto inyectado;
- actuaciones de agentes.

Este cambio no añade campos al esquema: solo lee.

## Goals / Non-Goals

**Goals:** una recomendación de salida legible como tabla de reglas, un resumen ejecutivo arriba del informe, la
cobertura por capacidad y la guía final.

**Non-Goals:** despliegue automático; ningún agente decide.

## Decisions

### 1. `releaseVerdict(history)` en `report/verdict.ts`

Función pura sobre la última ejecución y la anterior → `{ verdict: 'si' | 'reservas' | 'no', title, reasons:
{ kind: 'blocker' | 'reservation' | 'ok', text }[] }`.

| Regla | Tipo | Texto del motivo |
|---|---|---|
| Etapa bloqueante `failed` o `not_run` | `blocker` | "La etapa «X» ha fallado" / "no se ha ejecutado" |
| Requisito con algún test `failed` | `blocker` | "Falla el requisito PROMO-001 (y N más)" |
| `blockingFindings(findings) > 0` | `blocker` | "N hallazgos de seguridad bloquean" |
| `injectedDefect` | `blocker` | "Ejecución de demostración con el defecto «cupon» inyectado" |
| Tests `flaky` | `reservation` | "N tests solo pasaron al reintentar: «título»…" |
| Requisitos sin tests | `reservation` | "N requisitos sin pruebas: ID, ID…" |
| Menos requisitos cubiertos que la anterior | `reservation` | "Cubre N requisitos menos que la ejecución anterior" |
| Rendimiento medio de Lighthouse > 5 puntos peor que la anterior | `reservation` | "El rendimiento medio baja de A a B" |
| Sin ningún motivo anterior | `ok` | "Todas las etapas bloqueantes en verde, sin inestables y con todos los requisitos probados" |

- **Veredicto:** con algún `blocker` es `no`; si no, con alguna `reservation` es `reservas`; si no, `si`.
- **Motivos `ok` que acompañan a una reserva:** se añaden siempre que sean ciertos, como "Todas las etapas bloqueantes
  en verde", para que se lea qué va bien y qué no.

### 2. Resumen ejecutivo (`model.executive`)

- `verdict` (el de arriba);
- `compare`: filas de tests superados, requisitos cubiertos, hallazgos bloqueantes y duración, con valor actual,
  anterior y si mejora;
- `reporter`: la última actuación del Reportero (`date`, `change`, `summary`, `artifacts`), o `null`.

**Plantilla:** la primera sección tras la cabecera (`data-testid="executive"`) sustituye a la franja de estado
actual, que repetía lo mismo con menos información. Contiene:
- el veredicto como insignia con icono y texto (✔ / ⚠ / ✖), nunca solo color;
- la lista de motivos;
- una tabla "Frente a la ejecución anterior";
- una tarjeta "Lectura del Reportero".

Los KPIs siguen debajo.

**Resumen del *job*:** la etapa `report` añade `## ¿Podemos salir? <título>` y los motivos al
`GITHUB_STEP_SUMMARY`, antes del triaje.

### 3. Cobertura por capacidad (`model.coverageByCapability`)

Por capacidad: cuántos requisitos hay `passed`, `flaky`, `failed` y `untested`, ordenados por nombre.

**Gráfico:** barras horizontales apiladas con los mismos colores de estado que "Cobertura", y tabla alternativa
(`data-testid="capability-table"`). Va junto a "Cobertura", que pasa de pregunta global a detalle.

### 4. Reportero

`qa-reportero.md`:
- **Entradas:** `run.json`, histórico y veredicto.
- **Salida:** `qa/agents/reviews/reportero-<fecha>.md`, con veredicto, qué ha cambiado, riesgos para el cliente y qué
  falta para salir sin reservas.
- **Prohibido:** cambiar el veredicto o sus reglas, maquillar motivos y omitir *blockers*.
- **Registro:** `agent: 'reportero'`, fase "Informe y salida".

### 5. Guía

- **README:**
  - estado "laboratorio completo";
  - paso de ruta *¿Podemos salir?* (tras el informe);
  - el Reportero en el diagrama de agentes, al final, leyendo el registro y el informe.
- **`PROJECT.md`:** columna de estado en la hoja de ruta, con todo hecho.
- **`AGENTS.md`:**
  - estado y estructura (`qa/triage`, `qa/stability`, `qa/healer`, `report/verdict.ts`);
  - fila del Reportero enlazada.

## Gherkin

```gherkin
@e2e @p1 @QA-036 @QA-037
Scenario: El informe abre con la recomendación de salida y sus motivos

@e2e @p2 @QA-037
Scenario: Sin lectura del Reportero la sección lo dice

@e2e @p2 @QA-038
Scenario: El informe muestra los huecos por capacidad
```

## Risks / Trade-offs

- **[Umbral de 5 puntos de rendimiento]** → evita que el ruido de Lighthouse entre ejecuciones (±2-3 puntos) genere
  reservas falsas. Es una constante con nombre y se puede revisar.
- **[El veredicto usa solo la ejecución anterior]** → es suficiente para "¿hemos ido a mejor?". La tendencia larga
  sigue en sus gráficos.

## Migration Plan

Sin datos ni esquema nuevos.
