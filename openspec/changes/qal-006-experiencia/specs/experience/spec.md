# Spec Delta — experience

## Purpose

Define la calidad de la experiencia de La Tienda en Casa más allá de lo funcional: accesibilidad, uso con teclado,
aspecto visual estable, rendimiento de las páginas y comportamiento con varios usuarios a la vez.

## ADDED Requirements

### Requirement: EXP-001 Accesibilidad WCAG 2.1 AA
Las páginas clave de la tienda (portada, catálogo, ficha de producto, carrito, entrar y registro) SHALL superar la comprobación automática WCAG 2.1 AA sin violaciones de impacto grave o crítico. Cada violación encontrada SHALL indicar la página, la regla y los elementos afectados.

#### Scenario: Página accesible
- **WHEN** se analiza la portada con la comprobación WCAG 2.1 AA
- **THEN** no hay violaciones graves ni críticas

#### Scenario: Violación encontrada
- **GIVEN** una página con un botón sin nombre accesible
- **WHEN** se analiza
- **THEN** la comprobación falla indicando la página, la regla "button-name" y el elemento

### Requirement: EXP-002 Uso con teclado
Un cliente SHALL poder añadir un artículo al carrito y aplicar un cupón usando solo el teclado, con el foco siempre visible en el elemento activo.

#### Scenario: Comprar con el teclado
- **WHEN** el cliente recorre la ficha de producto con el tabulador y pulsa Intro en "Añadir al carrito"
- **THEN** el artículo se añade al carrito

#### Scenario: Foco visible
- **WHEN** el foco llega a un botón o enlace con el teclado
- **THEN** el elemento muestra un indicador de foco visible

### Requirement: EXP-003 Regresión visual con referencias aprobadas
La portada, el catálogo y una ficha de producto SHALL compararse con capturas de referencia aprobadas para la plataforma en la que se ejecutan; una diferencia mayor del 1 % de los píxeles SHALL hacer fallar la comprobación. Si no hay referencias para la plataforma, la comprobación SHALL constar como omitida con el motivo. Las referencias SHALL actualizarse solo mediante un Pull Request revisado.

#### Scenario: Sin cambios visuales
- **GIVEN** referencias aprobadas para la plataforma
- **WHEN** se ejecuta la regresión visual sin cambios en la interfaz
- **THEN** las tres capturas coinciden con sus referencias

#### Scenario: Sin referencias para la plataforma
- **GIVEN** que no hay referencias para el sistema en el que se ejecuta
- **WHEN** se ejecuta la regresión visual
- **THEN** consta como omitida con el motivo y cómo generar las referencias

### Requirement: EXP-004 Presupuesto de rendimiento
La portada, el catálogo y una ficha de producto SHALL cumplir en Lighthouse (escritorio): rendimiento ≥ 85, accesibilidad ≥ 90, buenas prácticas ≥ 90, SEO ≥ 90, LCP ≤ 2,5 s, CLS ≤ 0,1 y TBT ≤ 300 ms. Cada presupuesto incumplido SHALL indicar la página, la métrica, el valor medido y el límite.

#### Scenario: Página dentro del presupuesto
- **WHEN** se mide el catálogo con Lighthouse
- **THEN** todas sus métricas están dentro del presupuesto y quedan registradas en el resultado

#### Scenario: Presupuesto superado
- **GIVEN** una página con un LCP de 3,1 s
- **WHEN** se evalúa el presupuesto
- **THEN** falla con "LCP 3,1 s > 2,5 s" para esa página

### Requirement: EXP-005 Comportamiento con carga
Con 20 usuarios virtuales durante 30 segundos navegando por catálogo, ficha y API sobre la tienda levantada en el propio entorno de pruebas, el percentil 95 del tiempo de respuesta SHALL ser menor de 500 ms y la tasa de errores menor del 1 %. Sin la herramienta de carga instalada, la prueba SHALL constar como omitida con el motivo.

#### Scenario: Carga dentro de los umbrales
- **WHEN** se ejecuta la prueba de carga
- **THEN** el p95 es menor de 500 ms, los errores menores del 1 % y ambos quedan registrados en el resultado

#### Scenario: Umbral superado
- **GIVEN** una ejecución con un p95 de 800 ms
- **WHEN** se evalúan los umbrales
- **THEN** la prueba de carga falla indicando "p95 800 ms ≥ 500 ms"
