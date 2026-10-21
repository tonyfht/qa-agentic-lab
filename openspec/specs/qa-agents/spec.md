# qa-agents Specification

## Purpose

Define los agentes de IA que participan en la calidad de La Tienda en Casa: qué hace cada uno, qué tiene prohibido,
cómo queda registrado su trabajo y cómo se ejecutan, para que la IA aporte sin quitar el control a las personas.

## Requirements

### Requirement: QA-040 Agentes versionados con función y límites
Cada agente de QA SHALL estar definido en un fichero versionado del repositorio que declare su nombre, su función, sus entradas, sus salidas, las herramientas que puede usar y lo que tiene prohibido.

#### Scenario: Definición completa
- **WHEN** se revisa la definición de cualquier agente de QA
- **THEN** contiene las secciones de función, entradas, salidas, herramientas y prohibiciones

#### Scenario: Definición incompleta
- **GIVEN** un agente nuevo cuya definición no declara sus prohibiciones
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa de análisis estático falla señalando el agente y la sección que falta

### Requirement: QA-041 Revisor de especificaciones
El Revisor de specs SHALL revisar los requisitos de un cambio y producir un informe de revisión con los hallazgos de ambigüedad, falta de comprobabilidad y escenarios de error ausentes, sin modificar la especificación.

#### Scenario: Revisión de una spec
- **WHEN** el Revisor revisa la spec de una capacidad
- **THEN** deja un informe de revisión con un hallazgo por fila, indicando el requisito afectado y una propuesta

#### Scenario: El Revisor no reescribe la spec
- **WHEN** el Revisor encuentra un requisito ambiguo
- **THEN** lo anota en su informe y la spec queda sin cambios hasta que una persona decida

### Requirement: QA-042 Analista de escenarios
El Analista SHALL convertir requisitos en escenarios Gherkin etiquetados con el ID del requisito, la tipología y la prioridad, explorando la aplicación real con el navegador cuando el requisito tenga interfaz.

#### Scenario: Requisito convertido en escenarios
- **WHEN** el Analista trabaja sobre un requisito con interfaz
- **THEN** produce escenarios que llevan la etiqueta del requisito, una tipología (`@e2e`, `@api`...) y una prioridad (`@p1`..`@p3`)

#### Scenario: Requisito sin comportamiento observable
- **WHEN** el requisito no se puede observar desde la interfaz ni la API
- **THEN** el Analista lo indica en su registro y propone otra tipología en lugar de inventar un escenario

### Requirement: QA-043 Diseñador de casos con técnica declarada
El Diseñador de casos SHALL aplicar técnicas de diseño de pruebas y SHALL declarar la técnica de cada `Scenario Outline` con una etiqueta (`@valores-limite`, `@clases-equivalencia`, `@tabla-decision`, `@pairwise`).

#### Scenario: Combinaciones pairwise
- **WHEN** un requisito combina varios parámetros independientes
- **THEN** el Diseñador produce un `Scenario Outline` etiquetado `@pairwise` cuya tabla cubre cada pareja de valores al menos una vez

#### Scenario: Outline sin técnica
- **GIVEN** un `Scenario Outline` sin etiqueta de técnica
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa de análisis estático lo señala

### Requirement: QA-044 Automatizador que solo entrega lo que pasa
El Automatizador SHALL implementar los pasos de los escenarios reutilizando los existentes y SHALL entregar su trabajo solo cuando los escenarios pasan en local. No SHALL modificar aserciones de escenarios ya existentes.

#### Scenario: Entrega en verde
- **WHEN** el Automatizador termina
- **THEN** su PR incluye los pasos nuevos y la ejecución de la etapa E2E en verde

#### Scenario: Escenario que no consigue hacer pasar
- **WHEN** un escenario nuevo sigue fallando
- **THEN** el Automatizador no lo entrega como superado: lo marca como pendiente en su registro y explica el motivo

### Requirement: QA-045 Registro de actuaciones de los agentes
Toda actuación de un agente SHALL quedar registrada con fecha, agente, cambio, acción, artefactos producidos y resumen. El registro SHALL validarse contra su esquema en cada ejecución y SHALL incorporarse al resultado de la ejecución.

#### Scenario: Actuación registrada
- **WHEN** un agente termina una actuación
- **THEN** el registro tiene una entrada nueva que valida contra el esquema y aparece en el resultado de la siguiente ejecución

#### Scenario: Registro inválido
- **GIVEN** una entrada de registro sin agente o con un agente desconocido
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa de análisis estático falla indicando la línea y el campo

### Requirement: QA-046 Ejecución de agentes en GitHub bajo demanda
Los agentes SHALL poder lanzarse a mano desde GitHub Actions indicando agente y cambio, y su trabajo SHALL llegar como Pull Request. Sin la clave de la IA configurada, la ejecución SHALL omitirse indicando el motivo.

#### Scenario: Lanzamiento con clave
- **GIVEN** la clave de la IA configurada en el repositorio
- **WHEN** se lanza el workflow de agentes con un agente y un cambio
- **THEN** el agente trabaja sobre ese cambio y su resultado llega como Pull Request sujeto a revisión humana

#### Scenario: Lanzamiento sin clave
- **WHEN** se lanza el workflow de agentes sin la clave configurada
- **THEN** la ejecución termina sin error y su resumen indica "omitido: falta ANTHROPIC_API_KEY"

### Requirement: QA-047 Agente de API y barrido de contrato
El Agente de API SHALL diseñar pruebas de contrato y de negocio a partir del documento OpenAPI. Un barrido automático SHALL llamar a cada operación de lectura pública del contrato (sin parámetros obligatorios ni sesión) y validar su respuesta, de modo que una operación nueva quede cubierta sin escribir un test para ella.

#### Scenario: Barrido de contrato
- **WHEN** se ejecuta el barrido
- **THEN** cada operación GET pública sin parámetros obligatorios del OpenAPI se llama y su respuesta valida contra el contrato

#### Scenario: Operación que no cumple su contrato
- **GIVEN** una operación cuya respuesta no coincide con su esquema publicado
- **WHEN** se ejecuta el barrido
- **THEN** la prueba falla indicando la operación y el campo que no cumple

### Requirement: QA-048 Auditor de experiencia
El Auditor de experiencia SHALL leer las métricas de accesibilidad, rendimiento, regresión visual y carga de una ejecución y producir hallazgos priorizados en lenguaje de negocio, sin cambiar presupuestos ni umbrales.

#### Scenario: Auditoría de una ejecución
- **WHEN** el Auditor revisa las métricas de una ejecución
- **THEN** deja un informe con un hallazgo por fila, su impacto para el cliente y una propuesta

#### Scenario: El Auditor no relaja presupuestos
- **GIVEN** un presupuesto incumplido
- **WHEN** el Auditor lo revisa
- **THEN** lo explica y propone cómo corregir la causa, sin modificar el presupuesto

### Requirement: QA-049 Auditor de seguridad y cumplimiento
El Auditor de seguridad y cumplimiento SHALL priorizar los hallazgos de una ejecución por riesgo real para el negocio, revisar que cada excepción aceptada siga justificada y proponer correcciones, sin aceptar hallazgos nuevos ni modificar reglas por su cuenta.

#### Scenario: Auditoría de hallazgos
- **WHEN** el Auditor revisa los hallazgos de una ejecución
- **THEN** deja un informe con cada hallazgo priorizado, su riesgo explicado y una propuesta

#### Scenario: El Auditor no acepta riesgos
- **GIVEN** un hallazgo medio sin aceptar
- **WHEN** el Auditor lo revisa
- **THEN** propone la corrección o una excepción para que una persona la apruebe, sin añadirla él

### Requirement: QA-050 Sanador con guardia de aserciones
El Sanador SHALL reparar tests rotos por cambios no funcionales entregando un PR que declara `Agente: sanador`. La etapa de gobierno SHALL rechazar ese PR si modifica un `.feature`, código fuera de `tests/steps/` y `tests/support/`, o el comparador o el valor esperado de una aserción (`expect(...)`). Cambiar el localizador dentro de `expect(...)` o una espera SHALL estar permitido.

#### Scenario: Reparación de un localizador
- **GIVEN** un PR del Sanador que cambia `getByTestId('results-total')` por `getByTestId('results-count')` en un step
- **WHEN** se ejecuta la etapa de gobierno
- **THEN** la guardia lo acepta

#### Scenario: Intento de cambiar una aserción
- **GIVEN** un PR del Sanador que cambia `toHaveText('5 artículos')` por `toHaveText('6 artículos')`
- **WHEN** se ejecuta la etapa de gobierno
- **THEN** la guardia lo rechaza nombrando el fichero y la aserción cambiada

#### Scenario: Intento de tocar la tienda o una especificación
- **GIVEN** un PR del Sanador que modifica un fichero de `app/` o un `.feature`
- **WHEN** se ejecuta la etapa de gobierno
- **THEN** la guardia lo rechaza nombrando el fichero

### Requirement: QA-051 Detector de inestables
El sistema SHALL calcular sobre el histórico, en una ventana de las últimas 20 ejecuciones, qué tests han sido inestables (`flaky`) y con qué frecuencia, y la tasa de tests inestables de cada ejecución. El agente Detector de inestables SHALL usar ese cálculo para proponer corrección o cuarentena, sin aplicar la cuarentena él mismo.

#### Scenario: Test inestable en el histórico
- **GIVEN** un test que fue `flaky` en 2 de las últimas 10 ejecuciones en que se ejecutó
- **WHEN** se calcula la estabilidad
- **THEN** aparece con una tasa del 20 % y la fecha de la última vez que fue inestable

#### Scenario: Test estable
- **GIVEN** un test que pasó a la primera en todas las ejecuciones
- **WHEN** se calcula la estabilidad
- **THEN** no aparece en la lista de inestables

### Requirement: QA-052 Triaje de fallos
Cada test `failed` o `flaky` de una ejecución SHALL recibir una categoría de triaje (`producto`, `test`, `entorno`, `inestable` o `desconocido`) con el motivo que la decidió. Los fallos de categoría `producto` SHALL generar un borrador de *issue* de defecto con el requisito, el mensaje y el enlace a la evidencia. El agente de Triaje SHALL revisar la clasificación y abrir los *issues*, sin cambiar tests ni código.

#### Scenario: Fallo de producto
- **GIVEN** un test que falla porque el valor recibido no es el esperado
- **WHEN** se hace el triaje
- **THEN** su categoría es `producto` y hay un borrador de *issue* con su requisito

#### Scenario: Fallo del test
- **GIVEN** un test que falla porque el elemento que busca no existe en la página
- **WHEN** se hace el triaje
- **THEN** su categoría es `test` y la propuesta es pasarlo al Sanador

#### Scenario: Fallo del entorno
- **GIVEN** un test que falla porque el servidor responde 503 o la conexión es rechazada
- **WHEN** se hace el triaje
- **THEN** su categoría es `entorno`

#### Scenario: Sin regla que aplique
- **GIVEN** un fallo cuyo mensaje no coincide con ninguna regla
- **WHEN** se hace el triaje
- **THEN** su categoría es `desconocido` y queda para revisión del agente

### Requirement: QA-055 Reportero
El Reportero SHALL redactar, para una ejecución, un resumen ejecutivo en lenguaje de negocio a partir de la recomendación de salida, sus motivos y la comparación con el histórico. Puede discrepar de la recomendación argumentándolo, pero SHALL NOT cambiarla ni cambiar las reglas que la deciden.

#### Scenario: Resumen de una ejecución
- **WHEN** el Reportero revisa una ejecución
- **THEN** deja un resumen con el veredicto, qué ha mejorado o empeorado frente al histórico y qué haría falta para salir sin reservas

#### Scenario: Discrepancia con el veredicto
- **GIVEN** que el Reportero cree que un motivo de reserva no tiene impacto para el cliente
- **WHEN** redacta el resumen
- **THEN** lo argumenta en el texto y el veredicto del informe no cambia
