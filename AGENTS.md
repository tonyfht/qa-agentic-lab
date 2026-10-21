# QA Agentic Lab — Guía para agentes

Briefing base para cualquier agente (IA o persona) que trabaje en este repositorio. Léelo completo antes de tocar nada.

---

## Qué es este proyecto

Laboratorio público que demuestra **automatización de pruebas con agentes de IA dentro de un ciclo de vida gobernado
por especificación (SDD)**. Tiene dos mitades en un mismo repositorio:

| Mitad | Qué es | Dónde vive |
|---|---|---|
| **Producto** | *La Tienda en Casa*: e-commerce pequeño de artículos para el hogar (catálogo con búsqueda y filtros, carrito, cupones, checkout con pago simulado, pedidos) | `app/` |
| **Sistema de calidad** | Pruebas de todas las tipologías, pipeline por etapas, agentes de QA, trazabilidad y portal de calidad | `tests/`, `.claude/agents/`, `.github/workflows/`, `portal/` |

La tienda existe **para ser probada**: es deliberadamente pequeña. Si una funcionalidad no sirve para enseñar una
técnica o tipología de prueba, no se construye.

Público objetivo: proyecto **formativo y sin ánimo de lucro**, para personas que se inician en QA y para clientes a los
que se presenta el laboratorio. Todo lo visible (README, portal, informes, specs) debe poder explicarse **desde cero** a
alguien que no sabe de QA ni conoce el proyecto.

> Estado: fundación. El stack, la estructura y el pipeline los fija el cambio `QAL-001` (ver `openspec/changes/`).
> Hasta que se apruebe y archive, las secciones marcadas *(pendiente QAL-001)* son propuesta, no norma.

---

## Principios (no negociables)

1. **La especificación es la fuente de verdad.** Ningún código de producto ni de pruebas sin un cambio de OpenSpec
   aprobado que lo pida. Los escenarios GIVEN/WHEN/THEN de las specs son el origen de los `.feature` Gherkin.
2. **La IA diseña, repara y explica; no decide.** El veredicto de calidad (pasa/falla, se fusiona/no se fusiona) lo dan
   pruebas deterministas y *quality gates*. Ningún agente puede aprobar su propio trabajo.
3. **Todo cambio de un agente entra por Pull Request** revisado por una persona. Nunca push directo a `main`.
4. **El Sanador repara tests, no comportamiento.** Puede cambiar selectores, esperas o estructura de un test; nunca una
   aserción sobre el comportamiento esperado. Si el fallo es del producto, se abre un defecto, no se "cura".
5. **Trazabilidad de punta a punta** con un único identificador por requisito (ver Convenciones).
6. **Repositorio público**: cero secretos en el código; claves solo en *GitHub Secrets*. Nada de datos personales
   reales: usuarios, direcciones y tarjetas son ficticios.
7. **Solo se atacan sistemas propios.** Carga (k6) y escaneo activo de seguridad (ZAP) se ejecutan contra la tienda
   levantada en el propio runner o en nuestro despliegue, nunca contra terceros.

---

## Flujo SDD con OpenSpec

Toda funcionalidad nueva (de la tienda o del sistema de calidad) sigue este orden con los comandos `/opsx:*`:

| Paso | Comando | Gate |
|---|---|---|
| 0. Explorar (opcional) | `/opsx:explore` | — |
| 1. Proponer | `/opsx:propose QAL-XXX-nombre` | `proposal.md` nace en `borrador`; **no se implementa sin aprobación explícita** |
| 2. Implementar | `/opsx:apply` | Código, Gherkin y tests juntos; pipeline en verde |
| 3. Ajustar (si aplica) | `/opsx:update` | Artefactos coherentes con lo implementado |
| 4. Archivar | `/opsx:archive QAL-XXX-nombre` | Tareas cerradas, specs sincronizadas, fila en `openspec/README.md` |

- **IDs de cambio:** `QAL-XXX-nombre-descriptivo` (3 dígitos, kebab-case). Siguiente libre: `openspec/README.md`.
- **Rama de trabajo:** `change/qal-0xx-<nombre>`. Fusión a `main` por PR, sin *squash*.
- "Cuéntame cómo lo harías" **no** es autorización para implementar.

---

## Convenciones

**Identificadores de requisito.** Cada requisito de una spec lleva un ID estable `<DOMINIO>-<NNN>` al inicio de su
nombre (`### Requirement: CAT-001 Búsqueda por texto`). El mismo ID aparece como etiqueta en el escenario Gherkin
(`@CAT-001`), en el test automatizado y en el informe. Es la columna vertebral de la trazabilidad.

| Dominio | Prefijo |
|---|---|
| Catálogo | `CAT` |
| Carrito | `CART` |
| Promociones y cupones | `PROMO` |
| Checkout y pago simulado | `CHK` |
| Pedidos | `ORD` |
| Cuenta y acceso | `ACC` |
| Sistema de calidad (pipeline, agentes, portal) | `QA` |

**Idioma.** Documentación, specs, Gherkin y textos de la tienda en **español**. Código e identificadores en inglés
técnico. Palabras clave estructurales de OpenSpec (`Requirement`, `Scenario`, `SHALL`, `MUST`) y de Gherkin en inglés
(`Feature`, `Scenario`, `Given`...) para que las herramientas las reconozcan.

**Etiquetas Gherkin.** Además del ID: tipología (`@e2e`, `@api`, `@a11y`, `@visual`...), prioridad (`@p1`..`@p3`) y
`@smoke` para el subconjunto crítico.

---

## Estructura del repositorio *(pendiente QAL-001)*

```
app/                  → La Tienda en Casa (front + API documentada con OpenAPI)
tests/
  features/           → Gherkin por dominio, derivado de las specs
  e2e/ api/ unit/ ... → automatización por tipología
.claude/agents/       → definición versionada de los agentes de QA
.github/workflows/    → pipeline por etapas
portal/               → portal de calidad publicado en GitHub Pages
openspec/             → specs, cambios y archivo (fuente de verdad)
```

---

## Agentes de QA *(pendiente de su cambio propio)*

| Agente | Función | Cuándo actúa |
|---|---|---|
| Analista | Explora la tienda y convierte las specs en `.feature` con riesgos y prioridades | Diseño |
| Diseñador de casos | Aplica técnicas (equivalencia, valores límite, tablas de decisión, *pairwise*) a los escenarios | Diseño |
| Automatizador | Implementa los *steps* y tests, y solo entrega lo que pasa | Diseño |
| Agente de API | Diseña pruebas de contrato y negocio desde la especificación OpenAPI | Diseño |
| Sanador | Repara tests rotos por cambios no funcionales; abre PR con evidencia | Tras un fallo en CI |
| Triaje | Clasifica fallos y abre *issues* de defecto con evidencia | Tras un fallo en CI |
| Auditor no funcional | Interpreta accesibilidad, rendimiento y seguridad en lenguaje de negocio | Tras cada ejecución |
| Reportero | Compara con ejecuciones anteriores, redacta el resumen y publica el portal | Tras cada ejecución |

Las *quality gates* son deterministas; un agente solo puede explicar por qué una gate bloquea, no levantarla.
