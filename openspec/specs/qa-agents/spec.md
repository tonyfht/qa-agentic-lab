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
