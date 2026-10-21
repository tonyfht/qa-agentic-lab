# QAL-010 — La Tienda en Casa, de maqueta a tienda

**Estado:** aprobado por el fundador (2026-10-21) · **Fecha:** 2026-10-21 · **Tipo:** UX/UI + producto

Decisiones de dirección ya tomadas por el fundador (2026-10-21):
- **imágenes:** fotos reales con licencia libre;
- **estilo:** "hogar cálido";
- **alcance:** visual más mejoras de UX.

## Why

La tienda funciona de principio a fin y está muy probada, pero **parece una maqueta**:
- **No hay imágenes reales.** Cada artículo es un icono con dos iniciales ("MA", "ER"), y es lo primero que se ve.
- **La cabecera no es de tienda:**
  - el texto plano "Carrito (0)", sin icono ni contador destacado;
  - sin buscador;
  - sin categorías;
  - sin la franja de ventajas (envío gratis, devoluciones) que cualquier *e-commerce* muestra arriba.
- **La portada** son cuatro novedades sobre fondo crema: sin banner, sin categorías y sin nada que invite a comprar.
- **El catálogo:**
  - en el móvil, los filtros ocupan toda la primera pantalla antes del primer artículo;
  - en escritorio, es un formulario con un botón "Aplicar".
- **La ficha:**
  - se queda corta: sin galería, sin información de envío o devolución y sin productos relacionados;
  - deja media pantalla vacía.
- **El carrito:**
  - sin fotos;
  - la barra de envío gratis existe como texto, pero no se ve.
- **El pago:** sin pasos ni señales de confianza.

Para un laboratorio que se enseña a clientes esto resta: la primera impresión de la demo es la tienda, y hoy dice
"prototipo". Además, una tienda con imágenes, más componentes y más interacción es **mejor material de QA**:
- rendimiento real (LCP con fotos);
- accesibilidad de imágenes y menús;
- regresión visual con significado;
- más escenarios E2E.

## What Changes

### Identidad visual "hogar cálido"

- **Paleta crema, terracota y tinta**, con contraste AA comprobado.
- **Tipografía:** serif en titulares y sans en la interfaz, autoalojadas con `next/font`, sin peticiones a terceros
  (CMP-003 sigue en vigor).
- **Componentes coherentes:** botones, insignias, campos, tarjetas e iconos de línea.

### Fotos reales

- **Cuántas:**
  - una por artículo (24);
  - una por categoría (5);
  - 2 de ambiente para la portada.
- **De dónde:** Unsplash o Pexels, con licencias que permiten el uso sin coste.
- **Cómo se sirven:**
  - descargadas una vez, recortadas y optimizadas a WebP, guardadas en `public/images/`;
  - servidas por la propia tienda con `next/image` (tamaños responsivos y carga diferida).
- **Créditos:** cada foto lleva autor, fuente y licencia en `public/images/CREDITOS.md`. Una prueba comprueba que
  ninguna imagen se queda sin crédito.
- **Accesibilidad:** cada foto tiene un texto alternativo que describe el artículo.

### Mejoras de UX, cada una con requisito y pruebas

| Dónde | Mejora |
|---|---|
| Cabecera | Franja de ventajas, buscador presente en todas las páginas, menú de categorías, icono de carrito con contador y cuenta |
| Portada | Banner de temporada, accesos por categoría, "Mejor valorados" y "Novedades", sello de confianza |
| Catálogo | Categoría, orden y stock se aplican al cambiar (búsqueda y precio, con "Aplicar", que también funciona sin JavaScript); filtros activos como chips que se quitan con un clic; en el móvil, filtros en un cajón |
| Tarjeta de artículo | Foto, valoración, insignias (novedad, últimas unidades, agotado) y **añadir al carrito desde la tarjeta** |
| Ficha | Foto grande, migas de pan, selector de cantidad accesible, envío y devolución, y **artículos relacionados** de la misma categoría |
| Carrito | Fotos, **barra de progreso hacia el envío gratis**, carrito vacío con sugerencias |
| Pago | Indicador de pasos (carrito → envío y pago → confirmación) y señales de confianza (pago simulado, datos ficticios) |
| Pie | Columnas (tienda, ayuda, laboratorio), privacidad y enlace al informe de calidad |

**Sin cambios de negocio.** No cambian los precios, cupones, stock, reglas de envío ni pago, ni la API. Los
requisitos funcionales existentes y sus pruebas siguen valiendo. Donde hoy hay un `data-testid` se conserva, para
que el cambio visual no rompa las pruebas.

### Calidad del rediseño

- **Accesibilidad:** sin violaciones graves en todas las páginas, con el cajón de filtros y el menú navegables con
  teclado.
- **Rendimiento:**
  - presupuestos de Lighthouse sin rebajar (rendimiento ≥ 85, LCP ≤ 2,5 s), ahora con fotos;
  - la foto principal de la portada se carga con prioridad, y el resto, en diferido.
- **Regresión visual:** se regeneran las referencias de Linux con el PR, revisadas a mano antes de aprobarlas.
- **Antes y después:** el Auditor de experiencia compara Lighthouse y accesibilidad antes y después.

## Capabilities

### New Capabilities

- `storefront`: escaparate y navegación (`SHOP-0xx`): cabecera, portada, pie, imágenes y créditos.

### Modified Capabilities

- `catalog`: filtros inmediatos con chips y cajón en móvil, y artículos relacionados.
- `cart`: añadir desde la tarjeta, progreso hacia el envío gratis y carrito vacío con sugerencias.
- `checkout`: indicador de pasos.
- `experience`: presupuestos con imágenes, carga prioritaria de la imagen principal y accesibilidad de componentes
  nuevos.

## Valor para la demo

- **La primera impresión pasa a ser de tienda**, con fotos, ofertas visibles y una navegación de las de verdad.
- **El rediseño se hace con el mismo método:** spec, Gherkin y pruebas. Las *quality gates* demuestran que un cambio
  grande de UI no rompe nada: mismos requisitos en verde, presupuestos cumplidos y referencias visuales nuevas
  aprobadas por una persona.
- **Material nuevo para enseñar:** rendimiento con imágenes, accesibilidad de un cajón y un menú, y pruebas sobre
  componentes interactivos.

## Testing scope

- **E2E:** cada mejora de UX con su escenario, entre ellos:
  - añadir desde la tarjeta;
  - chips de filtros;
  - cajón de filtros en el móvil;
  - relacionados;
  - barra de envío gratis;
  - pasos del pago.
- **Regresión:** toda la suite actual, sin tocar aserciones.
- **Accesibilidad y rendimiento:** con imágenes.
- **Regresión visual:** con referencias nuevas.
- **Unitarias:** la selección de relacionados, el progreso de envío gratis y que cada imagen tenga su crédito.
- **Riesgo:** medio.
  - El LCP con fotos puede acercarse al presupuesto. Se mitiga con WebP, tamaños responsivos y prioridad en la
    imagen principal.
  - Muchas pruebas E2E dependen de la estructura de la página. Se conservan `data-testid`, roles y textos visibles.

## Cumplimiento de los requisitos transversales

- **RT-2:** sin cambios de comandos; la regresión visual y Lighthouse cubren el rediseño.
- **RT-4:** capturas nuevas en la ruta de la visita y mención en el README.
- **RT-5:** el Auditor de experiencia audita antes y después.

## Fuera de alcance

- **Cambios de negocio:** precios rebajados, opiniones con número de reseñas o favoritos (lo que en la dirección
  elegida era "datos").
- **Nuevas funcionalidades de cuenta:** lista de deseos, direcciones guardadas.
- **Tema oscuro de la tienda.**
- **Imágenes generadas por IA.**

## Riesgos

- **Derechos de las fotos** → solo fuentes con licencia libre y verificable, con crédito por foto en el repositorio.
  Una prueba falla si falta alguno.
- **Peso del repositorio** → unas 31 imágenes WebP de unos 40-80 KB cada una (menos de 3 MB en total).
- **Las referencias visuales cambian en todas las páginas** → es esperado. Se regeneran en Linux con el workflow y
  las revisa una persona.

## Criterios de éxito

1. Todas las páginas de la tienda tienen la nueva identidad y fotos reales con crédito.
2. Las mejoras de UX de la tabla funcionan y tienen su escenario en verde.
3. Toda la suite anterior sigue en verde sin cambiar ninguna aserción.
4. Los presupuestos de Lighthouse y de accesibilidad se cumplen sin rebajarlos.
5. La recomendación de salida del informe sigue en "Sí, se puede salir".

## Impact

- **Tienda:** `app/` (todas las páginas y `_components/`), `app/globals.css`, `next.config.ts` (imágenes locales).
- **Imágenes:** `public/images/` y `CREDITOS.md`; `lib/catalog` (relacionados, ruta de imagen por artículo).
- **Pruebas:** `tests/features/*` y `tests/steps/*` (escenarios nuevos), y referencias visuales.
- **Documentación:** README y specs `storefront`, `catalog`, `cart`, `checkout` y `experience`.
