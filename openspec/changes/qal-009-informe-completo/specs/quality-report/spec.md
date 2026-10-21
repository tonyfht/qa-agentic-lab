# Spec Delta — quality-report

## ADDED Requirements

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
