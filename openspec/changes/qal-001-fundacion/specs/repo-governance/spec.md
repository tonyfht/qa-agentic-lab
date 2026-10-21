# Spec Delta — repo-governance

## Purpose

Define las reglas de contribución que gobiernan el repositorio: cómo entra un cambio, cómo se traza a su especificación
y cómo se protegen la rama principal y los secretos.

## ADDED Requirements

### Requirement: QA-020 Main protegida
La rama `main` SHALL aceptar cambios solo mediante Pull Request con el pipeline en verde. Los PR abiertos por un agente o un bot SHALL requerir la aprobación de una persona propietaria del código. El push directo a `main` SHALL estar bloqueado.

#### Scenario: Push directo
- **WHEN** alguien intenta hacer push directo a `main`
- **THEN** GitHub lo rechaza

#### Scenario: PR con pipeline en rojo
- **GIVEN** un Pull Request cuyo pipeline ha fallado
- **WHEN** se intenta fusionar
- **THEN** GitHub no permite la fusión

#### Scenario: PR de un agente sin revisar
- **GIVEN** un PR abierto por un agente con el pipeline en verde
- **WHEN** se intenta fusionar sin la aprobación de una persona propietaria
- **THEN** GitHub no permite la fusión

### Requirement: QA-021 Cada PR identifica su cambio
Cada Pull Request SHALL indicar en su descripción el ID del cambio de OpenSpec que implementa (`QAL-XXX`) o declararse explícitamente como mantenimiento. Una comprobación automática SHALL bloquear los PR que no cumplan.

#### Scenario: PR con ID de cambio
- **GIVEN** un PR cuya descripción incluye `QAL-001`
- **WHEN** se ejecuta la comprobación de gobierno
- **THEN** la comprobación pasa

#### Scenario: PR sin ID
- **GIVEN** un PR sin ID de cambio ni marca de mantenimiento
- **WHEN** se ejecuta la comprobación de gobierno
- **THEN** la comprobación falla con un mensaje que explica qué añadir

#### Scenario: ID de un cambio inexistente
- **GIVEN** un PR que cita `QAL-999` y ese cambio no existe en `openspec/`
- **WHEN** se ejecuta la comprobación de gobierno
- **THEN** la comprobación falla indicando que el cambio no existe

### Requirement: QA-022 Plantillas de contribución
El repositorio SHALL ofrecer una plantilla de Pull Request, con el ID del cambio y la lista de comprobación de README e informe, y plantillas de *issue* para defecto y para requisito nuevo.

#### Scenario: Abrir un defecto
- **WHEN** alguien abre un *issue* de tipo defecto
- **THEN** la plantilla pide pasos para reproducir, resultado esperado, resultado obtenido, evidencia e ID de requisito afectado

#### Scenario: Plantilla de PR
- **WHEN** alguien abre un Pull Request
- **THEN** la descripción parte de la plantilla con el campo de ID de cambio y la lista de comprobación

### Requirement: QA-023 Sin secretos en el repositorio
El pipeline SHALL buscar secretos en cada ejecución, y SHALL fallar si encuentra alguno no justificado en la configuración de excepciones versionada.

#### Scenario: Secreto introducido
- **GIVEN** un commit que contiene una clave con formato de credencial
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa de análisis estático falla y señala el fichero y la línea

#### Scenario: Valor de prueba justificado
- **GIVEN** un valor ficticio con formato de credencial, registrado como excepción con su motivo
- **WHEN** se ejecuta el pipeline
- **THEN** la búsqueda de secretos no falla por él

### Requirement: QA-024 Dependencias vigiladas
El repositorio SHALL proponer automáticamente actualizaciones de dependencias de npm y de GitHub Actions al menos una vez por semana, como Pull Requests sujetos al mismo pipeline.

#### Scenario: Dependencia desactualizada
- **GIVEN** una dependencia con versión nueva disponible
- **WHEN** llega la revisión semanal
- **THEN** se abre un Pull Request de actualización que ejecuta el pipeline

#### Scenario: Actualización que rompe
- **GIVEN** un PR de actualización cuyo pipeline falla
- **WHEN** se intenta fusionar
- **THEN** la fusión está bloqueada como cualquier otro PR

### Requirement: QA-025 Saltos de línea normalizados
El repositorio SHALL fijar los finales de línea de los ficheros de texto para que el contenido sea idéntico en Windows, macOS y Linux.

#### Scenario: Commit desde Windows
- **WHEN** se hace commit de un fichero de texto desde Windows
- **THEN** el fichero se guarda en el repositorio con finales de línea LF y git no muestra avisos de conversión

#### Scenario: Fichero binario
- **WHEN** se hace commit de una imagen
- **THEN** git no altera su contenido
