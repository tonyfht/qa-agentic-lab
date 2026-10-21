# Spec Delta — experience

## ADDED Requirements

### Requirement: EXP-006 Imágenes que no frenan la tienda
Las fotos SHALL servirse en tamaños adecuados a cada pantalla (`next/image`, WebP) y con dimensiones reservadas, para que no muevan el contenido. Solo la imagen principal de cada página SHALL cargarse con prioridad; el resto, en diferido. Con fotos, las páginas medidas SHALL seguir dentro del presupuesto de EXP-004, que no se rebaja.

#### Scenario: Portada con fotos dentro del presupuesto
- **WHEN** Lighthouse mide la portada
- **THEN** el rendimiento es al menos 85, el LCP no pasa de 2,5 s y el CLS no pasa de 0,1

#### Scenario: Fotos fuera de pantalla en diferido
- **WHEN** abro el catálogo
- **THEN** solo la primera fila de fotos se pide al cargar y las demás al acercarse a la pantalla
