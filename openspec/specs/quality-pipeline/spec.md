# quality-pipeline Specification

## Purpose

Define cómo se ejecuta el sistema de calidad: etapas, disparadores, paridad entre local y GitHub Actions, *quality
gates* y resumen de cada ejecución.

## Requirements

### Requirement: QA-001 La tienda arranca y responde
El pipeline SHALL levantar La Tienda en Casa antes de las etapas que la prueban. Una etapa de humo SHALL comprobar que la API responde a la comprobación de salud y que la portada muestra la marca.

#### Scenario: Tienda sana
- **GIVEN** la tienda levantada por el pipeline
- **WHEN** se consulta `GET /api/health`
- **THEN** responde 200 con un cuerpo que indica estado correcto y la versión de la aplicación
- **AND** la portada muestra el nombre "La Tienda en Casa"

#### Scenario: La tienda no arranca
- **GIVEN** un cambio que impide arrancar la tienda
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa de arranque falla con un mensaje que lo indica
- **AND** las etapas que prueban la tienda no se ejecutan y constan como no ejecutadas, no como superadas

### Requirement: QA-008 Análisis estático del código
Cada ejecución SHALL pasar el linter y la comprobación de tipos sobre todo el código del repositorio, y SHALL fallar la etapa de análisis estático si cualquiera de los dos encuentra errores.

#### Scenario: Código limpio
- **WHEN** se ejecuta la etapa de análisis estático sobre código sin errores de lint ni de tipos
- **THEN** ambas comprobaciones constan como superadas

#### Scenario: Error de tipos
- **GIVEN** un cambio con un error de tipos
- **WHEN** se ejecuta la etapa de análisis estático
- **THEN** la comprobación de tipos falla con el fichero y la línea del error y la etapa falla

### Requirement: QA-002 Etapas ejecutables en local
Cada etapa del pipeline SHALL poder ejecutarse en local con un único comando, y el conjunto completo SHALL ejecutarse con `npm run qa`, en el mismo orden que en CI.

#### Scenario: Pipeline completo en local
- **GIVEN** un clon limpio con dependencias instaladas
- **WHEN** se ejecuta `npm run qa`
- **THEN** se ejecutan en orden las mismas etapas que en CI
- **AND** se genera el resultado de la ejecución y el informe

#### Scenario: Una sola etapa
- **WHEN** se ejecuta `npm run qa -- --stage <etapa>` con una etapa existente
- **THEN** se ejecuta solo esa etapa y sus requisitos previos (por ejemplo, levantar la tienda)

#### Scenario: Etapa inexistente
- **WHEN** se ejecuta `npm run qa -- --stage <etapa>` con un nombre que no existe
- **THEN** el comando termina con error y lista las etapas disponibles

### Requirement: QA-003 CI ejecuta las mismas etapas que local
GitHub Actions SHALL ejecutar las etapas invocando los mismos comandos que se usan en local, sin lógica de prueba propia del workflow. Cada etapa SHALL verse como un paso diferenciado de la ejecución.

#### Scenario: Etapas visibles en GitHub
- **WHEN** se abre una ejecución del pipeline en GitHub Actions
- **THEN** se ven por separado las etapas de análisis estático, arranque de la tienda, humo e informe, con su estado y duración

#### Scenario: Mismo resultado en ambos entornos
- **GIVEN** el mismo commit
- **WHEN** se ejecuta el pipeline en local y en CI
- **THEN** ambos resultados contienen las mismas etapas y los mismos tests con el mismo estado

### Requirement: QA-004 Disparadores del pipeline
El pipeline SHALL ejecutarse en cada Pull Request contra `main`, en cada push a `main`, a demanda desde la interfaz de GitHub y de forma programada al menos una vez al día.

#### Scenario: Ejecución a demanda
- **WHEN** una persona lanza el pipeline desde la pestaña Actions
- **THEN** se ejecuta completo sobre la rama elegida sin necesitar ningún secreto

#### Scenario: Ejecución programada
- **WHEN** llega la hora programada
- **THEN** el pipeline se ejecuta sobre `main` y su resultado se añade al histórico

### Requirement: QA-005 Quality gate de la ejecución
Una ejecución SHALL considerarse fallida si falla cualquier etapa bloqueante. Las etapas posteriores al fallo SHALL ejecutarse si no dependen de la etapa fallida, para que el informe recoja todo el estado.

#### Scenario: Falla una etapa bloqueante
- **GIVEN** un test de humo que falla
- **WHEN** termina la ejecución
- **THEN** la ejecución termina en rojo
- **AND** el informe se genera igualmente con el fallo visible

#### Scenario: Reintento que oculta inestabilidad
- **GIVEN** un test que falla y pasa al reintentarlo
- **WHEN** termina la ejecución
- **THEN** el test consta como inestable (*flaky*) en el resultado, no como superado sin más

### Requirement: QA-006 Resumen legible de cada ejecución
Cada ejecución SHALL producir un resumen legible sin abrir el informe: estado global, estado y duración por etapa, número de tests por estado y enlace al informe.

#### Scenario: Resumen en GitHub
- **WHEN** termina una ejecución en GitHub Actions
- **THEN** su página muestra el resumen con una fila por etapa y el enlace al informe

#### Scenario: Resumen en local
- **WHEN** termina `npm run qa`
- **THEN** la consola muestra el mismo resumen y la ruta del informe local

### Requirement: QA-007 Nada se omite en silencio
Una etapa que no pueda ejecutarse en un entorno (por falta de un servicio o de un secreto) SHALL constar como omitida, con el motivo, en el resumen y en el resultado.

#### Scenario: Etapa sin requisito disponible
- **GIVEN** una etapa que necesita un secreto que no está configurado
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa consta como omitida con el motivo "falta <secreto>"
- **AND** la ejecución no la cuenta como superada

#### Scenario: Comprobación interna sin su herramienta
- **GIVEN** una comprobación de una etapa que necesita una herramienta no instalada (por ejemplo Gitleaks)
- **WHEN** se ejecuta la etapa
- **THEN** esa comprobación consta como omitida con el motivo y cómo instalar la herramienta, nunca como superada

### Requirement: QA-009 Calidad de especificaciones y escenarios
La etapa de análisis estático SHALL comprobar que cada requisito tiene identificador, lenguaje normativo (SHALL/MUST) y al menos dos escenarios, que la validación de OpenSpec pasa, y que cada escenario Gherkin lleva etiqueta de requisito existente, tipología y prioridad.

#### Scenario: Specs y escenarios correctos
- **WHEN** se ejecuta el análisis estático sobre el repositorio
- **THEN** la comprobación de specs y la de etiquetado Gherkin constan como superadas

#### Scenario: Escenario que cita un requisito inexistente
- **GIVEN** un escenario etiquetado `@CAT-099` y ese requisito no existe en ninguna spec
- **WHEN** se ejecuta el análisis estático
- **THEN** la comprobación de etiquetado falla indicando el fichero, el escenario y la etiqueta

### Requirement: QA-019 Etapa de rendimiento y carga
El pipeline SHALL tener una etapa de rendimiento y carga, bloqueante, que levanta la tienda y ejecuta Lighthouse y la prueba de carga con el mismo comando en local y en CI, y SHALL dejar sus métricas en el resultado de la ejecución.

#### Scenario: Etapa en CI
- **WHEN** se ejecuta el pipeline en GitHub Actions
- **THEN** la etapa "Rendimiento y carga" aparece como un paso propio con su estado y sus métricas en el resumen

#### Scenario: Presupuesto incumplido
- **GIVEN** una página que supera su presupuesto de rendimiento
- **WHEN** se ejecuta la etapa
- **THEN** la etapa falla y la ejecución queda en rojo

### Requirement: QA-027 Etapa de seguridad y cumplimiento
El pipeline SHALL tener una etapa bloqueante de seguridad y cumplimiento que ejecuta SAST, auditoría de dependencias, licencias, SBOM y DAST pasivo con el mismo comando en local y en CI, y SHALL dejar los hallazgos normalizados en el resultado de la ejecución.

#### Scenario: Etapa en CI
- **WHEN** se ejecuta el pipeline en GitHub Actions
- **THEN** la etapa "Seguridad y cumplimiento" aparece como paso propio y el SBOM queda como artefacto de la ejecución

#### Scenario: Hallazgo bloqueante
- **GIVEN** un hallazgo alto sin aceptar
- **WHEN** se ejecuta la etapa
- **THEN** la etapa falla y la ejecución queda en rojo
