# Spec Delta — compliance

## Purpose

Define las evidencias de cumplimiento de La Tienda en Casa: licencias de los componentes que se distribuyen,
inventario de componentes (SBOM) y privacidad de quien visita la tienda.

## ADDED Requirements

### Requirement: CMP-001 Licencias permitidas
Cada dependencia de producción instalada SHALL tener una licencia de la lista permitida, o una excepción versionada que nombre el paquete, la licencia y el motivo. Una licencia desconocida o no permitida sin excepción SHALL bloquear.

#### Scenario: Licencias permitidas
- **WHEN** se revisan las licencias de producción
- **THEN** todas están permitidas o tienen excepción con motivo

#### Scenario: Licencia no permitida
- **GIVEN** una dependencia de producción con licencia GPL-3.0 sin excepción
- **WHEN** se revisan las licencias
- **THEN** la comprobación falla nombrando el paquete y su licencia

### Requirement: CMP-002 Inventario de componentes (SBOM)
Cada ejecución SHALL generar un SBOM en formato CycloneDX de las dependencias de producción y SHALL conservarlo como evidencia de esa ejecución.

#### Scenario: SBOM generado
- **WHEN** termina la etapa de seguridad y cumplimiento
- **THEN** existe un SBOM CycloneDX con los componentes de producción y su número queda en el resultado

#### Scenario: Fallo al generar el SBOM
- **WHEN** la herramienta de SBOM falla
- **THEN** la comprobación falla con el error y la etapa no se da por superada

### Requirement: CMP-003 Privacidad del visitante
La tienda no SHALL hacer peticiones desde el navegador a dominios de terceros, y SHALL usar solo dos cookies, ambas estrictamente necesarias (`session` y `cart_id`), descritas en la página `/privacidad`.

#### Scenario: Sin terceros
- **WHEN** se recorre la tienda (portada, catálogo, ficha y carrito)
- **THEN** todas las peticiones del navegador van a la propia tienda

#### Scenario: Cookies declaradas
- **WHEN** se abre `/privacidad`
- **THEN** describe las cookies `session` y `cart_id`, para qué sirven y cuánto duran
