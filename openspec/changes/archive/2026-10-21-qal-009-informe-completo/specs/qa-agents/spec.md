# Spec Delta — qa-agents

## ADDED Requirements

### Requirement: QA-055 Reportero
El Reportero SHALL redactar, para una ejecución, un resumen ejecutivo en lenguaje de negocio a partir de la recomendación de salida, sus motivos y la comparación con el histórico. Puede discrepar de la recomendación argumentándolo, pero SHALL NOT cambiarla ni cambiar las reglas que la deciden.

#### Scenario: Resumen de una ejecución
- **WHEN** el Reportero revisa una ejecución
- **THEN** deja un resumen con el veredicto, qué ha mejorado o empeorado frente al histórico y qué haría falta para salir sin reservas

#### Scenario: Discrepancia con el veredicto
- **GIVEN** que el Reportero cree que un motivo de reserva no tiene impacto para el cliente
- **WHEN** redacta el resumen
- **THEN** lo argumenta en el texto y el veredicto del informe no cambia
