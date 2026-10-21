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

### Requirement: QA-017 Qué ha hecho la IA
El informe SHALL responder a "¿Qué ha hecho la IA?" con el número de actuaciones por agente y la lista de las últimas actuaciones con su cambio, sus artefactos y su resumen. Sin actuaciones registradas SHALL explicarlo en lugar de mostrar un gráfico vacío.

#### Scenario: Actuaciones registradas
- **GIVEN** un resultado con actuaciones de dos agentes
- **WHEN** se abre el informe
- **THEN** la sección "¿Qué ha hecho la IA?" muestra cuántas actuaciones tiene cada agente y las últimas con su resumen

#### Scenario: Sin actuaciones
- **GIVEN** un resultado sin actuaciones de agentes
- **WHEN** se abre el informe
- **THEN** la sección explica que todavía no hay actuaciones registradas

### Requirement: QA-018 Es usable y rápida
El informe SHALL responder a "¿Es usable y rápida?" con las puntuaciones de Lighthouse por página, la evolución del rendimiento entre ejecuciones, el p95 y la tasa de errores de la prueba de carga, y el número de violaciones de accesibilidad. Sin métricas SHALL explicar por qué faltan.

#### Scenario: Con métricas
- **GIVEN** una ejecución con métricas de Lighthouse y de carga
- **WHEN** se abre el informe
- **THEN** la sección muestra las puntuaciones por página, el p95 y la tasa de errores

#### Scenario: Sin métricas
- **GIVEN** una ejecución en la que la etapa de rendimiento no se ejecutó
- **WHEN** se abre el informe
- **THEN** la sección explica que no hay métricas de rendimiento en esta ejecución

### Requirement: QA-026 Es segura y cumple
El informe SHALL responder a "¿Es segura y cumple?" con los hallazgos por gravedad y por fuente, las excepciones aceptadas con su motivo, el número de componentes del SBOM y el estado de licencias. Sin hallazgos registrados SHALL explicar si la etapa no se ejecutó.

#### Scenario: Con hallazgos
- **GIVEN** una ejecución con hallazgos de varias fuentes
- **WHEN** se abre el informe
- **THEN** la sección muestra los hallazgos por gravedad y fuente y las excepciones con su motivo

#### Scenario: Etapa no ejecutada
- **GIVEN** una ejecución sin la etapa de seguridad
- **WHEN** se abre el informe
- **THEN** la sección explica que no hay resultados de seguridad en esta ejecución

### Requirement: QA-053 Es estable la suite
El informe SHALL responder a "¿Es estable la suite?" con la tasa de tests inestables de cada ejecución del histórico, la lista de tests más inestables de la ventana con su frecuencia y los tests en cuarentena con su motivo y caducidad. Si ninguna ejecución tiene tests inestables, SHALL decirlo en lugar de mostrar un gráfico vacío.

#### Scenario: Histórico con inestables
- **GIVEN** un histórico en el que un test fue inestable en dos ejecuciones
- **WHEN** se abre el informe
- **THEN** la sección muestra la tasa por ejecución y ese test con su frecuencia

#### Scenario: Suite estable
- **GIVEN** un histórico sin tests inestables
- **WHEN** se abre el informe
- **THEN** la sección dice que ningún test ha sido inestable en la ventana

### Requirement: QA-054 Que han reparado los agentes
El informe SHALL responder a "¿Qué han reparado los agentes?" con el triaje de la ejecución (fallos por categoría y cada fallo con su categoría y motivo) y las actuaciones registradas del Sanador, el Detector de inestables y el Triaje. Una ejecución con defecto inyectado SHALL mostrarse con un aviso que nombra el defecto.

#### Scenario: Ejecución con fallos
- **GIVEN** una ejecución con un fallo de producto y uno de test
- **WHEN** se abre el informe
- **THEN** la sección muestra una categoría de cada y el motivo de cada fallo

#### Scenario: Ejecución con defecto inyectado
- **GIVEN** una ejecución con el defecto `cupon` inyectado
- **WHEN** se abre el informe
- **THEN** un aviso al principio dice que es una ejecución de demostración con el defecto `cupon`

### Requirement: QA-036 Podemos salir
El sistema SHALL recomendar, solo con reglas deterministas sobre la ejecución y la anterior, "Sí, se puede salir", "Salir con reservas" o "No salir", siempre con sus motivos. "No salir" SHALL aplicarse ante una etapa bloqueante fallida o sin ejecutar, un requisito que falla, hallazgos de seguridad bloqueantes o un defecto inyectado. "Salir con reservas" SHALL aplicarse ante inestables, requisitos sin pruebas, menos cobertura o más de 5 puntos de rendimiento perdidos.

#### Scenario: Todo en verde
- **GIVEN** una ejecución con todas las etapas bloqueantes superadas, sin inestables y con todos los requisitos probados
- **WHEN** se calcula la recomendación
- **THEN** es "Sí, se puede salir"

#### Scenario: Inestables
- **GIVEN** una ejecución en verde con un test inestable
- **WHEN** se calcula la recomendación
- **THEN** es "Salir con reservas" y un motivo nombra el test inestable

#### Scenario: Requisito que falla
- **GIVEN** una ejecución en la que falla un test del requisito PROMO-001
- **WHEN** se calcula la recomendación
- **THEN** es "No salir" y un motivo nombra PROMO-001

#### Scenario: Defecto inyectado
- **GIVEN** una ejecución con el defecto `cupon` inyectado
- **WHEN** se calcula la recomendación
- **THEN** es "No salir" y un motivo dice que es una ejecución de demostración

### Requirement: QA-037 Resumen ejecutivo
El informe SHALL abrir con la sección "¿Podemos salir?", que muestre la recomendación con sus motivos, la comparación con la ejecución anterior (tests superados, requisitos cubiertos, hallazgos bloqueantes y duración) y la última lectura del Reportero con su fecha. La recomendación SHALL presentarse como recomendación, no como decisión. El resumen de la ejecución en GitHub Actions SHALL incluir la recomendación y sus motivos.

#### Scenario: Informe con veredicto
- **WHEN** se abre el informe de una ejecución en verde
- **THEN** lo primero tras la cabecera es "¿Podemos salir?" con "Sí, se puede salir" y sus motivos

#### Scenario: Sin lectura del Reportero
- **GIVEN** un histórico sin actuaciones del Reportero
- **WHEN** se abre el informe
- **THEN** la sección lo dice en lugar de mostrar una lectura vacía

### Requirement: QA-038 Donde estan los huecos
El informe SHALL responder a "¿Dónde están los huecos?" con los requisitos de cada capacidad por estado (superados, inestables, fallidos y sin pruebas), con su tabla alternativa.

#### Scenario: Capacidad con huecos
- **GIVEN** una ejecución en la que la capacidad `cart` tiene un requisito sin pruebas
- **WHEN** se abre el informe
- **THEN** el gráfico y su tabla muestran `cart` con 1 requisito sin pruebas

#### Scenario: Todo cubierto
- **GIVEN** una ejecución con todos los requisitos probados
- **WHEN** se abre el informe
- **THEN** la tabla muestra 0 sin pruebas en todas las capacidades

### Requirement: QA-039 Agentes en el flujo
El informe SHALL tener el botón "Agentes de QA en este flujo", que abre `agentes.html` en otra pestaña. La página SHALL mostrar la línea del flujo con el estado de cada etapa en la ejecución, una calle por agente con sus paradas según el registro y una ficha por agente. Al elegir un agente, SHALL resaltar sus paradas y atenuar a los demás. SHALL funcionar sin red y con teclado, con una tabla alternativa.

#### Scenario: Abrir la página desde el informe
- **WHEN** pulso "Agentes de QA en este flujo" en el informe
- **THEN** se abre la página de agentes con la línea del flujo y los 11 agentes

#### Scenario: Elegir un agente
- **WHEN** elijo "Auditor de seguridad y cumplimiento"
- **THEN** solo la parada "Seguridad" queda marcada como suya, las calles de los demás agentes se atenúan y su ficha dice qué hace

#### Scenario: Estado de las etapas
- **GIVEN** una ejecución en la que falló la etapa "Smoke y E2E"
- **WHEN** abro la página de agentes
- **THEN** la parada "E2E" se muestra como fallida

#### Scenario: Alternativa accesible
- **WHEN** abro la tabla alternativa
- **THEN** cada agente aparece con las paradas en las que interviene
