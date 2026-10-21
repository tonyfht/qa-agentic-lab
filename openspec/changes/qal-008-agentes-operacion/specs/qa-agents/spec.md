# Spec Delta — qa-agents

## ADDED Requirements

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
