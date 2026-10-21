# Auditoría de experiencia del rediseño — 2026-10-21

**Agente:** Auditor de experiencia ([definición](../../../.claude/agents/qa-auditor-experiencia.md)).
**Cambio:** QAL-010, de maqueta a tienda.
**Antes:** CI `ci-39650514124-1` (`bc9ddf3`), la última publicada sin el rediseño.
**Después:** ejecución local completa en la rama `change/qal-010-tienda-retail`.
**Ejecutado por:** Claude Code (sesión del fundador, QAL-010).

## Antes y después

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP antes → después | CLS |
|---|---|---|---|---|---|---|
| Portada | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 523 ms → 786 ms | 0 → 0 |
| Catálogo | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 479 ms → 636 ms | 0 → 0 |
| Ficha | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 453 ms → 632 ms | 0 → 0 |

Además:
- **Accesibilidad con axe:** sin violaciones graves ni críticas en 10 páginas, entre ellas la nueva de créditos y el
  catálogo con el cajón de filtros abierto en el móvil.
- **Suite:** 465 pruebas en verde, con todas las anteriores sin cambiar ninguna aserción.

## Hallazgos

| # | Hallazgo | Métrica y valor | Impacto para el cliente | Prioridad | Propuesta |
|---|---|---|---|---|---|
| 1 | La portada tarda más en mostrar lo principal: ahora es una foto, no texto | LCP 523 → 786 ms, presupuesto 2.500 ms | Ninguno apreciable: la página principal aparece en menos de un segundo, un tercio del presupuesto | Informativa | Mantener `priority` solo en la foto del banner y vigilar el LCP en el informe |
| 2 | Las fotos no mueven la página al cargar | CLS 0 en las tres páginas | El cliente no pulsa un botón equivocado porque algo se desplace | Informativa | Mantener `width` y `height` en todas las imágenes (`next/image` lo exige) |
| 3 | El cajón de filtros en el móvil deja ver los artículos sin desplazarse | Primer artículo dentro de la pantalla a 390 px (escenario CAT-011) | Antes, en el móvil, los filtros ocupaban la primera pantalla entera | Resuelto | — |
| 4 | El contraste del color principal mejora | Blanco sobre terracota: 4,6:1 → 5,3:1 | Los botones se leen mejor, también con poca luz | Resuelto | — |
| 5 | El foco del teclado en el pie oscuro es terracota sobre tinta | Contraste del contorno, unos 2,2:1 | Quien navega con teclado ve el foco en el pie, pero con menos claridad que en el resto | Baja | Usar un contorno claro en el pie (`focus-visible:outline-[#e7a27f]`) en un cambio de mantenimiento |
| 6 | Las referencias visuales cambian en todas las páginas | Portada, catálogo y ficha | Ninguno: es el rediseño; las nuevas referencias las aprueba una persona en el PR | Esperada | Regenerarlas en Linux con el workflow *Referencias visuales* |

## Conclusión

El rediseño **no empeora la experiencia** y la mejora donde más pesa:
- en el móvil, los filtros ya no tapan los artículos;
- el contraste de los botones mejora;
- hay fotos reales con texto alternativo.

Todos los presupuestos se cumplen sin rebajarlos.
