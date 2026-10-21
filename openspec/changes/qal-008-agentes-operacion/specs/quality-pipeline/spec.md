# Spec Delta — quality-pipeline

## ADDED Requirements

### Requirement: QA-028 Cuarentena con caducidad
Un test listado en `qa/cuarentena.json` SHALL seguir ejecutándose y apareciendo en el resultado, pero su fallo SHALL NOT bloquear la etapa. Cada entrada SHALL llevar título del test, fichero, motivo, *issue*, fecha de alta y fecha de caducidad no más de 14 días después del alta. El análisis estático SHALL fallar si alguna entrada está caducada o incompleta.

#### Scenario: Test en cuarentena que falla
- **GIVEN** un test en cuarentena vigente
- **WHEN** falla en la etapa E2E y no falla ningún otro
- **THEN** la etapa pasa, y el test consta como fallido con el aviso "en cuarentena"

#### Scenario: Cuarentena caducada
- **GIVEN** una entrada cuya fecha de caducidad ya pasó
- **WHEN** se ejecuta el análisis estático
- **THEN** falla nombrando el test y pidiendo corregirlo o renovar la entrada con motivo

#### Scenario: Cuarentena demasiado larga
- **GIVEN** una entrada con caducidad a más de 14 días del alta
- **WHEN** se ejecuta el análisis estático
- **THEN** falla indicando el máximo permitido

### Requirement: QA-029 Inyección de defectos para la demo
El orquestador SHALL aceptar `--inject <defecto>` (o la variable `QA_INJECT_DEFECT`) con un defecto del catálogo: `cupon`, `selector` o `caida`. La tienda SHALL activar el defecto solo si esa variable existe y no se está en el despliegue (`VERCEL`). El resultado SHALL registrar el defecto inyectado, el informe SHALL avisarlo de forma visible, y una ejecución con defecto inyectado SHALL NOT publicarse en el histórico.

#### Scenario: Defecto de producto inyectado
- **WHEN** se ejecuta la etapa E2E con `--inject cupon`
- **THEN** falla el escenario de cupones sin distinguir mayúsculas y su triaje es `producto`

#### Scenario: Defecto desconocido
- **WHEN** se pide `--inject inventado`
- **THEN** el orquestador termina con error y lista los defectos disponibles

#### Scenario: Sin variable, sin defecto
- **GIVEN** que `QA_INJECT_DEFECT` no existe o existe `VERCEL`
- **WHEN** la tienda atiende una petición
- **THEN** se comporta según sus specs

### Requirement: QA-035 Reintento ante errores de la herramienta
Cuando Lighthouse termina con un error propio de la herramienta (no una puntuación baja), la etapa de rendimiento SHALL repetir la medición de esa página una vez. Si el reintento mide, el test SHALL constar como `flaky` con el error original en el mensaje.

#### Scenario: Error de traza de Lighthouse
- **GIVEN** que Lighthouse devuelve `NO_NAVSTART` en la primera medición de una página
- **WHEN** el reintento mide la página dentro del presupuesto
- **THEN** el test consta como `flaky` y la etapa no falla por esa página

#### Scenario: Presupuesto incumplido
- **GIVEN** que Lighthouse mide la página por debajo del presupuesto
- **WHEN** termina la medición
- **THEN** no se reintenta y el test falla
