# Spec Delta — quality-pipeline

## Purpose

Define cómo se ejecuta el sistema de calidad: etapas, disparadores, paridad entre local y GitHub Actions, *quality
gates* y resumen de cada ejecución.

## ADDED Requirements

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
