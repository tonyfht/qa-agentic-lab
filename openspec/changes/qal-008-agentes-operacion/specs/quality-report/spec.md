# Spec Delta — quality-report

## ADDED Requirements

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
