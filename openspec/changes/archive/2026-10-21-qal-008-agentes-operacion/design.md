# Design — QAL-008 Agentes de operación

## Context

Ver `proposal.md` y los requisitos:
- QA-050…052 (agentes);
- QA-028, QA-029 y QA-035 (pipeline);
- QA-053 y QA-054 (informe).

**Punto de partida medido:**
- El histórico publicado tiene 15 ejecuciones de CI, sin ningún test inestable.
- En local (Windows), con dos *workers*, aparecen 2 inestables por ejecución. Son tests distintos cada vez y siempre
  con el mismo error, `Tearing down "context" exceeded the test timeout`: el navegador tarda en cerrarse con la máquina
  cargada. Es inestabilidad del **entorno**, no de los tests.
- En CI, Lighthouse falló una vez con `NO_NAVSTART` y pasó al relanzar.

Estos tres datos son los primeros casos reales del Triaje y del Detector de inestables.

## Goals / Non-Goals

**Goals:**
- Reglas deterministas y puras para el triaje, la estabilidad, la cuarentena y la guardia del Sanador, con pruebas
  unitarias sobre mensajes reales.
- Agentes que interpretan y proponen sobre esos datos.
- Inyección de defectos que se pueda enseñar en un minuto.

**Non-Goals:**
- Abrir *issues* o PRs sin la clave de la IA.
- Un clasificador con aprendizaje.
- Reintentar el pipeline entero.

## Decisions

### 1. Triaje: tabla de reglas ordenada (`qa/triage/classify.ts`)

`classifyFailure(test) → { category, reason }`. Gana la primera regla que coincide, y el orden importa:

| # | Regla (sobre `status` y `message`) | Categoría | Motivo mostrado |
|---|---|---|---|
| 1 | `status === 'flaky'` | `inestable` | Pasó al reintentar |
| 2 | `Tearing down`, `browserContext.close`, `Target page, context or browser has been closed`, `ECONNREFUSED`, `net::ERR_`, `socket hang up`, `NO_NAVSTART`, `Runtime error encountered` | `entorno` | El navegador, la red o la herramienta fallaron |
| 3 | `Received: 5\d\d` o `status 5\d\d` | `entorno` | El servidor respondió 5xx: servicio no disponible |
| 4 | `element(s) not found`, `strict mode violation`, `resolved to 0 elements`, `waiting for getBy…`/`locator(` sin `Received:` con valor | `test` | El test no encuentra lo que busca: candidato al Sanador |
| 5 | `Expected` … `Received` | `producto` | La tienda no devuelve lo que dice la spec |
| 6 | Cualquier otro | `desconocido` | Ninguna regla aplica: revisión del agente |

La regla 3 va antes que la 5: un 503 también trae `Expected: 200 / Received: 503`, pero no es un defecto de negocio.

**Dónde se aplica:** en `qa/results/assemble.ts`. Cada `TestResult` `failed` o `flaky` recibe `triage: { category,
reason }`, un campo opcional, así que sigue siendo `schemaVersion: 1`.

**Salida:** la etapa `report` escribe `triaje.md` en la ejecución:
- tabla por categoría;
- un borrador de *issue* por cada fallo de producto, con título, requisito, mensaje y enlace a la evidencia.

En CI se añade al resumen del *job*.

### 2. Estabilidad sobre el histórico (`qa/stability/stability.ts`)

`stability(history, window = 20)`:
- **Por ejecución:** `flakyRate = flaky / (passed + failed + flaky)`.
- **Por test**, por título y fichero, que sobreviven a cambios del id de Playwright: veces ejecutado, veces `flaky`,
  tasa y fecha de la última vez, ordenado por tasa.

Solo cuentan los tests ejecutados, no los omitidos.

### 3. Cuarentena (`qa/quarantine.ts` + `qa/cuarentena.json`)

```json
{ "tests": [{ "titulo": "…", "fichero": "tests/features/…", "motivo": "…", "issue": "https://github.com/…/issues/N",
  "desde": "AAAA-MM-DD", "hasta": "AAAA-MM-DD" }] }
```

- `checkQuarantine(file, today)` → errores: campos vacíos, caducada (`hasta < today`) o más de 14 días entre `desde`
  y `hasta`. La llama la etapa `static`.
- `isQuarantined(test, entries)` por título y fichero.
- **Etapa `e2e`:** si Playwright termina con error, se miran los tests fallidos. Si todos están en cuarentena, la etapa
  pasa con el motivo "N test(s) en cuarentena fallaron (no bloquean)", y a cada uno se le antepone "En cuarentena: …"
  al mensaje.

El fichero nace vacío: hoy no hay ningún test que lo merezca, y lo dirá el Detector.

### 4. Guardia del Sanador (`qa/healer/guard.ts`)

`checkHealerDiff(diff) → errores`, sobre un `git diff` unificado:
- Un fichero fuera de `tests/steps/` y `tests/support/` → error, sea un `.feature`, `app/`, `lib/`, `openspec/`,
  `playwright.config.ts` o `qa/`.
- **Líneas `expect(`:** se compara la "cola" de la aserción, todo lo que va tras el último paréntesis que cierra
  `expect(…)`, como `.toHaveText(text)`. Si una cola eliminada no reaparece idéntica entre las añadidas del mismo
  fichero → error. Se permite cambiar el localizador (`expect(page.getByTestId('a'))` → `expect(page.getByTestId('b'))`)
  y añadir esperas (`waitFor…`, `toBeVisible()` previo), y no se permite eliminar aserciones.

La etapa `governance` la aplica cuando el cuerpo del PR contiene `Agente: sanador`. El diff es
`git diff origin/main...HEAD`, que en CI necesita `fetch-depth: 0` en el workflow de gobierno.

### 5. Inyección de defectos (`lib/qa/defects.ts`)

```ts
export const DEFECTS = { cupon: '…', selector: '…', caida: '…' } as const
export function activeDefect(env = process.env): Defect | null // null si no hay variable, si existe VERCEL o si no es del catálogo
```

| Defecto | Punto de inyección | Lo que pasa | Triaje esperado |
|---|---|---|---|
| `cupon` | `lib/cart/repository.ts`: se busca el código sin pasarlo a mayúsculas | `bienvenida10` deja de valer | `producto` |
| `selector` | `app/catalogo/page.tsx`: `data-testid="results-count"` en lugar de `results-total` | El total se ve igual, pero el test no lo encuentra | `test` |
| `caida` | `app/api/products/route.ts` responde 503 | La API de artículos "se cae"; la tienda sigue arrancando, porque `/api/health` no cambia | `entorno` |

**Orquestador:**
- `--inject <defecto>` valida contra el catálogo y fija `process.env.QA_INJECT_DEFECT`, que heredan el servidor de
  Playwright y los de las etapas;
- `RunResult.injectedDefect` (opcional) lo registra.

**Workflow:**
- entrada `defecto` (`ninguno` por defecto) en `workflow_dispatch`, que pasa `QA_INJECT_DEFECT` a todos los *jobs*;
- el *job* de publicar se salta si hay defecto.

**Informe:** franja de aviso arriba con el defecto, en ámbar (`--warning`) y no en rojo.

### 6. Reintento de Lighthouse (QA-035)

`measure(page)` se llama hasta 2 veces, solo si la herramienta termina con error o sin fichero. Si el segundo intento
mide, el test es `flaky`, `retries: 1`, y su mensaje lleva el error del primero. Un presupuesto incumplido nunca se
reintenta.

### 7. Informe

- **`buildModel`** añade:
  - `stability`: series por ejecución, top 10 de inestables y cuarentena vigente;
  - `operations`: triaje por categoría, fallos con su categoría y actuaciones de `sanador`, `detector-flaky` y
    `triaje`;
  - `injectedDefect`.
- **Sección "Estabilidad"** (`data-testid="stability"`):
  - columnas de % inestables por ejecución, con una sola serie y color `--series-1`;
  - tabla de inestables y lista de cuarentena;
  - sin inestables: texto "Ningún test ha sido inestable en las últimas N ejecuciones".
- **Sección "Agentes de operación"** (`data-testid="operations"`):
  - mosaicos por categoría de triaje, con el color de estado como icono y la etiqueta, nunca solo el color;
  - tabla de fallos con categoría y motivo;
  - lista de actuaciones de los tres agentes.
- **"Lo que irá apareciendo"** queda con el único elemento de QAL-009.

### 8. Agentes

| Id | Fichero | Fase | Herramientas | Prohibido (resumen) |
|---|---|---|---|---|
| `sanador` | `qa-sanador.md` | Operación | `playwright-test-healer`, Read/Edit en `tests/steps` y `tests/support` | Cambiar aserciones, `.feature`, tienda o specs; reparar un fallo de categoría `producto` |
| `detector-flaky` | `qa-detector-flaky.md` | Operación | Lectura del histórico y de `qa/cuarentena.json` | Poner en cuarentena por su cuenta; subir reintentos para tapar |
| `triaje` | `qa-triaje.md` | Operación | Lectura de la ejecución, `gh issue create` | Cambiar tests o código; cerrar *issues*; cambiar la categoría sin explicar por qué |

**`agents.yml`:** se añaden `qa-sanador`, `qa-detector-flaky` y `qa-triaje` a la lista de agentes. Sin clave, se
omiten como hasta ahora.

## Gherkin

```gherkin
@e2e @p2 @QA-053
Scenario: El informe dice si la suite es estable

@e2e @p2 @QA-054
Scenario: El informe dice qué han reparado los agentes y avisa del defecto inyectado
```

El resto de requisitos (QA-028, 029, 035, 050…052) se cubren con pruebas unitarias trazadas en el `describe`, sobre
mensajes reales capturados al inyectar cada defecto.

## Risks / Trade-offs

- **[Mensajes de Playwright que cambian entre versiones]** → las reglas se prueban con mensajes reales. Si una versión
  los cambia, la prueba falla antes que el triaje.
- **[`caida` deja muchos fallos]** → es lo esperado: enseña que muchos rojos pueden tener una sola causa de entorno.
- **[La guardia del Sanador es textual]** → se apoya en `expect(` por línea. Una aserción partida en varias líneas se
  trata como cambio de aserción, lo que bloquea de más y nunca de menos.

## Migration Plan

Sin datos. Campos opcionales en el resultado; el histórico existente sigue siendo válido.
