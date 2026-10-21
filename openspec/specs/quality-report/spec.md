# quality-report Specification

## Purpose

Define el registro de cada ejecución, el histórico acumulado y el informe de calidad propio que lo muestra igual en
local y en GitHub Pages.

## Requirements

### Requirement: QA-010 Resultado de ejecución con esquema versionado
Cada ejecución SHALL producir un único resultado en JSON que valida contra un esquema publicado en el repositorio. Cada resultado SHALL indicar su versión de esquema, commit, rama, origen (local o CI), fecha, etapas y tests.

#### Scenario: Resultado válido
- **WHEN** termina una ejecución
- **THEN** existe un fichero de resultado que valida contra el esquema vigente e indica su `schemaVersion`

#### Scenario: Resultado inválido
- **GIVEN** un resultado que no cumple el esquema
- **WHEN** se intenta añadir al histórico o generar el informe con él
- **THEN** la operación falla indicando qué campo incumple el esquema y el histórico no se modifica

### Requirement: QA-011 Trazabilidad de cada test
Cada test del resultado SHALL llevar los IDs de requisito que cubre, tomados de sus etiquetas. Los tests sin ID de requisito SHALL marcarse como no trazados.

#### Scenario: Test trazado
- **GIVEN** un escenario Gherkin etiquetado `@QA-001`
- **WHEN** se ejecuta
- **THEN** su entrada en el resultado incluye el requisito `QA-001`

#### Scenario: Test sin requisito
- **GIVEN** un test sin etiqueta de requisito
- **WHEN** se ejecuta
- **THEN** su entrada consta como no trazada y el informe la cuenta en un indicador visible de tests sin trazar

### Requirement: QA-012 Histórico acumulado
Cada ejecución que alimente el histórico SHALL añadir exactamente un registro al final del histórico, sin modificar los anteriores. El lector del histórico SHALL aceptar registros de versiones de esquema anteriores.

#### Scenario: Ejecución añadida
- **GIVEN** un histórico con N registros
- **WHEN** termina una ejecución que alimenta el histórico
- **THEN** el histórico tiene N+1 registros y los N primeros no han cambiado

#### Scenario: Registro de una versión anterior
- **GIVEN** un histórico con registros de una versión de esquema anterior
- **WHEN** se genera el informe
- **THEN** esos registros se muestran con los campos que tengan, sin error

### Requirement: QA-013 Solo main publica
Solo las ejecuciones en GitHub Actions sobre `main` SHALL actualizar el histórico y el informe públicos. Las ejecuciones de Pull Requests SHALL generar su informe como artefacto de la ejecución sin publicarlo.

#### Scenario: Ejecución de un PR
- **WHEN** termina el pipeline de un Pull Request
- **THEN** el informe público y el histórico público no cambian
- **AND** el informe del PR está disponible como artefacto de la ejecución

#### Scenario: Dos ejecuciones simultáneas en main
- **GIVEN** dos ejecuciones sobre `main` que terminan a la vez
- **WHEN** ambas publican
- **THEN** el histórico contiene los dos registros y ninguno se pierde

### Requirement: QA-014 Gráficos que responden una pregunta
Cada gráfico del informe SHALL mostrar junto a él la pregunta que responde. La primera versión SHALL incluir: tendencia de resultados por ejecución, duración por etapa y cobertura de requisitos.

#### Scenario: Tendencia
- **GIVEN** un histórico con varias ejecuciones
- **WHEN** se abre el informe
- **THEN** el gráfico "¿Estamos mejor o peor que antes?" muestra, por ejecución, los tests superados, fallidos, inestables y omitidos

#### Scenario: Requisitos cubiertos
- **WHEN** se abre el informe
- **THEN** la vista "¿Qué requisitos están cubiertos y cuáles fallan?" lista cada ID de requisito con su último estado y sus tests

#### Scenario: Sin datos suficientes
- **GIVEN** un histórico con una sola ejecución
- **WHEN** se abre el informe
- **THEN** el gráfico de tendencia explica que hacen falta al menos dos ejecuciones, en lugar de mostrarse vacío o engañoso

### Requirement: QA-015 Mismo informe en local y en GitHub Pages
El informe SHALL generarse con el mismo comando en local y en CI y SHALL poder abrirse sin servidor de aplicación. En local SHALL servirse en el puerto 3420 a partir del histórico local.

#### Scenario: Informe en local
- **GIVEN** al menos una ejecución local
- **WHEN** se ejecuta `npm run report`
- **THEN** el informe está disponible en `http://localhost:3420` con el histórico local

#### Scenario: Informe publicado
- **WHEN** termina una ejecución en `main`
- **THEN** el informe publicado en GitHub Pages refleja esa ejecución

### Requirement: QA-016 Detalle técnico enlazado
Cada test fallido o inestable del informe SHALL enlazar a su detalle técnico (traza, captura o vídeo) cuando exista.

#### Scenario: Test fallido con traza
- **GIVEN** un test fallido con traza de Playwright
- **WHEN** se consulta en el informe
- **THEN** el test muestra un enlace que abre su detalle técnico

#### Scenario: Detalle no disponible
- **GIVEN** un test fallido sin evidencia técnica
- **WHEN** se consulta en el informe
- **THEN** el informe indica que no hay detalle técnico, sin enlace roto
