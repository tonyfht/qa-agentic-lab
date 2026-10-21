# Design — QAL-010 La Tienda en Casa, de maqueta a tienda

## Context

Ver `proposal.md` y los requisitos:
- SHOP-001…004 (escaparate);
- CAT-010…012 (catálogo);
- CART-006 y 007 (carrito);
- PROMO-005 (envío gratis);
- CHK-006 (pago);
- EXP-006 (rendimiento con imágenes).

**El contrato de las pruebas actuales manda.** Inventario de lo que usan los *steps* hoy, que el rediseño conserva:

| Lo que usan las pruebas | Se conserva así |
|---|---|
| `getByRole('navigation', { name: 'Principal' })` con "Catálogo", "Mis pedidos", "Salir"... | La navegación principal sigue llamándose "Principal". Las categorías van en otra, "Categorías" |
| `getByTestId('cart-link')` con texto "Carrito (N)" | El icono y la insignia se ven; el texto es "Carrito" más `(N)`, con los paréntesis solo para lectores de pantalla (`sr-only`) |
| `getByLabel('Cantidad').selectOption(n)` en la ficha | Se mantiene un `<select>` nativo con la etiqueta "Cantidad": accesible, funciona con teclado y es el contrato de las pruebas |
| `getByRole('button', { name: 'Añadir al carrito' })` en la ficha | El botón de la ficha se llama así. Los de las tarjetas se llaman "Añadir {nombre} al carrito", así que no hay ambigüedad |
| `getByRole('button', { name: 'Aplicar' })` en el catálogo | Se mantiene para búsqueda y precio |
| `data-testid` actuales: `product-card`, `product-name`, `results-total`, `cart-message`, `total-*`, `free-shipping-hint`, `coupon-*`, `greeting`, `order-*`, `error-*`, `catalog-alert` | Todos se conservan en los mismos elementos |
| Tabulador hasta "Añadir al carrito" en menos de 40 pulsaciones | La cabecera suma unos 10 elementos enfocables; la ficha queda por debajo de 25 |

## Goals / Non-Goals

**Goals:**
- **Una identidad coherente:** tokens de color, tipografía, radios y sombras suaves.
- **Fotos reales** servidas por la tienda.
- **Las mejoras de UX de la propuesta,** cada una con su escenario.
- **Toda la suite actual en verde sin cambiar ninguna aserción.**

**Non-Goals:**
- Cambios de negocio y de API.
- Tema oscuro.
- Animaciones complejas.

## Decisions

### 1. Identidad "hogar cálido"

**Tokens de Tailwind 4** (`@theme` en `globals.css`):

| Token | Valor | Uso |
|---|---|---|
| `cream` | `#fbf7f1` | Fondo de página |
| `sand` | `#f3ebe0` | Superficies suaves, franjas |
| `ink` | `#2b2118` | Texto |
| `muted` | `#6b5a4b` | Texto secundario (contraste 6,4:1 sobre `cream`) |
| `terracotta` | `#a8481f` | Acción principal: 5,3:1 con texto blanco; antes era `#b4532a`, con 4,6:1 |
| `terracotta-dark` | `#7f3416` | *Hover* y texto de acento |
| `olive` | `#4f5b3a` | Insignia "Novedad" y garantías |
| `line` | `ink` al 10 % | Bordes |

**Tipografía:**
- Fraunces (serif, titulares) e Inter (interfaz), con `next/font/google`.
- `next/font` descarga las fuentes al compilar y las sirve la propia tienda, así que no hay peticiones a Google en el
  navegador (CMP-003 y CSP `font-src 'self'` se mantienen).
- Solo los pesos usados (400, 500, 600 y 700) y `display: swap`.

**Iconos:** SVG de línea propios en `app/_components/icons.tsx` (carrito, usuario, buscar, camión, devolución,
candado, estrella, filtros, cerrar, más). Sin dependencias nuevas.

### 2. Fotos

- **Dónde están:** `public/images/{productos,categorias,portada}/*.webp`, descargadas de Unsplash con la licencia
  Unsplash, que permite el uso gratuito, también comercial, sin atribución obligatoria. Aun así se acreditan todas.
- **Créditos:** `public/images/creditos.json` lleva, por foto, `file`, `alt`, `author`, `authorUrl`, `source` y
  `license`. Lo usan:
  - la página `/creditos`;
  - el `alt` de cada imagen: una sola fuente de verdad;
  - la prueba unitaria que compara ficheros y créditos en los dos sentidos.
- **Ruta y texto alternativo:** `lib/catalog/images.ts` devuelve, para un artículo o una categoría, su ruta y su texto
  alternativo. Si falta una foto, devuelve la ilustración actual (`ProductArt`), que se queda como respaldo.
- **`next/image`:** `sizes` ajustado a la rejilla, `priority` solo en la imagen principal (banner de portada y foto de
  la ficha) y el resto en diferido.
  - La optimización de Next sirve las imágenes desde `/_next/image`, el mismo origen, así que `img-src 'self'` basta.
  - `next.config.ts` limita `images.formats` a `['image/webp']` y los `deviceSizes` a los que se usan.

### 3. Cabecera, portada y pie

**Cabecera** (`SiteHeader`, Server Component, más `HeaderSearch`, componente de cliente pequeño):
- **Franja de ventajas** (`aria-label="Ventajas"`).
- **Fila principal:**
  - logotipo de texto, con "en Casa" en serif terracota;
  - buscador: un `<form action="/catalogo" method="get" role="search">` que funciona sin JavaScript;
  - cuenta;
  - carrito con insignia.
- **Fila de categorías:** `nav aria-label="Categorías"`, que enlaza a `/catalogo?category=…`.

**Portada:**
- banner de dos columnas, con texto y foto de salón con prioridad;
- cinco accesos circulares a las categorías;
- "Mejor valorados" (`topRated(products, 4)`: con stock y por valoración, función pura en `lib/catalog/merchandising.ts`);
- "Novedades";
- un banner secundario de textil, con el cupón TEXTIL15;
- la franja de garantías.

**Pie:**
- tres columnas (tienda, ayuda y laboratorio);
- una línea inferior con "Privacidad y cookies", "Créditos de las fotos" e "Informe de calidad".

### 4. Catálogo

- **Filtros inmediatos:** `FilterAutoSubmit`, componente de cliente que envía el formulario con `requestSubmit()` al
  cambiar la categoría, el orden o el stock. Sin JavaScript, "Aplicar" sigue funcionando.
- **Chips:** se calculan en el servidor a partir de la consulta (`activeFilterChips(query)`, función pura). Cada chip
  es un enlace a la URL sin ese parámetro, sin JavaScript. Su nombre accesible es "Quitar filtro: {valor}".
- **Cajón en el móvil** (`FiltersDrawer`, de cliente):
  - por debajo de `md`, el formulario va en un panel lateral con `role="dialog"` y `aria-modal`, que se abre con
    "Filtros";
  - al abrirse, el foco pasa a "Cerrar"; Escape, "Cerrar" o el fondo lo cierran, y el foco vuelve al botón;
  - en `md` y más, el mismo panel es la columna lateral, sin duplicar el formulario;
  - se descartó el `<dialog>` nativo porque obligaba a mostrarlo de dos formas (modal y en línea) según el ancho.
- **Tarjeta:**
  - foto 1:1 con zoom suave al pasar el ratón;
  - categoría, nombre, valoración (★ 4,6) e insignias ("Novedad", "Quedan N", "Agotado");
  - precio y botón "Añadir {nombre} al carrito" (CART-006).
  - El enlace de la tarjeta envuelve foto y nombre, y el botón queda fuera del enlace, porque no se anidan
    interactivos.

### 5. Ficha

- **Columnas:** galería de una foto grande con prioridad, y otra con migas de pan, nombre, valoración, precio con
  IVA, stock, descripción y `AddToCart` restyled (select "Cantidad" y botón ancho).
- **Bloque de envío y devolución:** envío gratis desde 50 €, 24-48 h y devolución en 30 días.
- **Relacionados** (`relatedProducts(product, all, 4)`, función pura, CAT-012) con tarjetas.

### 6. Carrito y pago

**Carrito:**
- **Líneas con foto** de 80 px, nombre enlazado a la ficha, precio unitario, select de cantidad (contrato actual),
  "Eliminar" y total de línea.
- **Barra de envío gratis** (`freeShippingProgress(totals)`, función pura, PROMO-005): `role="progressbar"` con
  `aria-valuenow`. El texto actual de `free-shipping-hint` se conserva dentro.
- **Carrito vacío** (CART-007): mensaje, enlace y 4 sugerencias (`topRated`) con su botón de añadir.

**Pasos** (`CheckoutSteps`, CHK-006): `ol` con `aria-label="Pasos de la compra"` y `aria-current="step"`. Aparecen en
el carrito, el pago y la confirmación.

**Pago:**
- mismo formulario, con iconos y tarjetas de sección;
- un resumen pegajoso con fotos;
- un sello "Pago simulado: no se cobra nada".

### 7. Cuenta y páginas de apoyo

Entrar, registro, pedidos, detalle de pedido y privacidad pasan a usar los mismos componentes y tokens, sin cambios
de estructura. Nueva página `/creditos`.

### 8. Pruebas

- **Escenarios nuevos** en `tests/features/storefront/escaparate.feature` (SHOP) y en las *features* de catálogo,
  carrito y pago (CAT-010…012, CART-006…007, PROMO-005, CHK-006). Los *steps* son nuevos y no cambian ninguno
  existente.
- **Unitarias puras** (`lib/catalog/merchandising.ts`, `lib/cart/progress.ts`, créditos): `topRated`,
  `relatedProducts`, `activeFilterChips`, `freeShippingProgress` y la coherencia entre ficheros y créditos.
- **Accesibilidad:** se añaden `/creditos` y el cajón abierto en el móvil a los escenarios de axe.
- **Regresión visual:** las referencias de Linux se regeneran con el workflow *Referencias visuales* en la rama y
  se incorporan revisadas, como en QAL-007.
- **Rendimiento:** Lighthouse mide las mismas tres páginas con los mismos presupuestos.

## Gherkin

```gherkin
@storefront @e2e @p1 @SHOP-001
Scenario: Buscar desde la cabecera en cualquier página

@catalog @e2e @p2 @CAT-010
Scenario: Quitar un filtro con su chip conserva los demás

@catalog @e2e @p2 @CAT-011
Scenario: En el móvil los filtros están en un cajón que se cierra con Escape

@cart @e2e @p1 @CART-006
Scenario: Añadir desde la tarjeta sin salir del catálogo

@promotions @e2e @p2 @PROMO-005
Scenario: La barra muestra lo que falta para el envío gratis

@checkout @e2e @p2 @CHK-006
Scenario: Los pasos marcan dónde estoy
```

## Risks / Trade-offs

- **[LCP de la portada con foto]** → foto de 1600 px en WebP (223 KB) con `priority` y `sizes`. El optimizador sirve
  unos 800 px en un escritorio normal. Si Lighthouse queda justo, se baja la calidad o el tamaño, nunca el
  presupuesto.
- **[El mismo panel en escritorio y en el móvil]** → en escritorio es la columna lateral y en el móvil un panel
  modal. Lo comprueban los escenarios de escritorio de siempre y los de CAT-011 a 390 px.
- **[Fraunces e Inter suman unos 80 KB]** → solo `latin` y los pesos usados.
- **[Fotos de Unsplash que puedan retirarse]** → una vez descargadas, viven en el repositorio y no dependen de
  Unsplash. El crédito queda.

## Migration Plan

Sin datos ni API. Referencias visuales nuevas.
