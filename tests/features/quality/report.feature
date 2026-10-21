@e2e @p2
Feature: Informe de calidad
  Como persona que revisa la calidad del producto
  quiero un informe en el que cada gráfico responda a una pregunta concreta
  para saber de un vistazo cómo está el producto y qué ha cambiado

  @QA-014
  Scenario: Cada gráfico muestra la pregunta que responde
    Given un histórico con 3 ejecuciones
    When abro el informe
    Then veo la pregunta "¿Estamos mejor o peor que antes?"
    And veo la pregunta "¿Dónde se va el tiempo del pipeline?"
    And veo la pregunta "¿Cuánto de lo especificado está probado?"
    And veo la pregunta "¿Qué requisitos están cubiertos y cuáles fallan?"
    And cada gráfico tiene su tabla alternativa

  @QA-014
  Scenario: Con una sola ejecución la tendencia lo explica en lugar de mostrarse vacía
    Given un histórico con 1 ejecución
    When abro el informe
    Then la tendencia explica que necesita al menos 2 ejecuciones

  @QA-015
  Scenario: El informe se abre desde disco sin pedir nada a la red
    Given un histórico con 2 ejecuciones
    When abro el informe
    Then la página no ha hecho ninguna petición fuera del disco

  @QA-016
  Scenario: Un test fallido enlaza a su detalle técnico
    Given un histórico cuya última ejecución tiene un test fallido con detalle técnico
    When abro el informe
    Then el test fallido muestra el enlace "ver detalle técnico"

  @QA-016
  Scenario: Un test fallido sin detalle técnico no muestra un enlace roto
    Given un histórico cuya última ejecución tiene un test fallido sin detalle técnico
    When abro el informe
    Then el test fallido indica que no hay detalle técnico

  @QA-017
  Scenario: El informe muestra lo que han hecho los agentes
    Given un histórico cuya última ejecución tiene actuaciones de agentes
    When abro el informe
    Then veo la pregunta "¿Qué ha hecho la IA?"
    And veo la actuación "Revisor de specs · revisión de especificación"

  @QA-017
  Scenario: Sin actuaciones la sección lo explica
    Given un histórico con 1 ejecución
    When abro el informe
    Then la sección de agentes explica que todavía no hay actuaciones

  @QA-018
  Scenario: El informe dice si la tienda es usable y rápida
    Given un histórico cuya última ejecución tiene métricas de rendimiento y carga
    When abro el informe
    Then veo la pregunta "¿Es usable y rápida?"
    And la experiencia muestra un p95 de "120 ms"

  @QA-018
  Scenario: Sin métricas de rendimiento la sección lo explica
    Given un histórico con 1 ejecución
    When abro el informe
    Then la sección de experiencia explica que no hay métricas de rendimiento

  @QA-026
  Scenario: El informe dice si la tienda es segura y cumple
    Given un histórico cuya última ejecución tiene hallazgos de seguridad
    When abro el informe
    Then veo la pregunta "¿Es segura y cumple?"
    And veo la excepción aceptada "CSP: script-src unsafe-inline [10055]" con su motivo

  @QA-026
  Scenario: Sin etapa de seguridad la sección lo explica
    Given un histórico con 1 ejecución
    When abro el informe
    Then la sección de seguridad explica que no hay resultados

  @QA-053
  Scenario: El informe dice si la suite es estable
    Given un histórico en el que un test fue inestable en 2 de 3 ejecuciones
    When abro el informe
    Then veo la pregunta "¿Es estable la suite?"
    And el test "Carrito › Se conserva al recargar" aparece como inestable "2 de 3"

  @QA-053
  Scenario: Sin inestables la sección lo dice
    Given un histórico con 2 ejecuciones
    When abro el informe
    Then la sección de estabilidad dice que ningún test ha sido inestable

  @QA-054
  Scenario: El informe dice qué han reparado los agentes y avisa del defecto inyectado
    Given una ejecución con el defecto "cupon" inyectado, un fallo de producto y uno de test
    When abro el informe
    Then veo la pregunta "¿Qué han reparado los agentes?"
    And el aviso de demostración nombra el defecto "cupon"
    And el fallo "Un cupón válido descuenta" aparece como "Defecto del producto"
    And el fallo "Filtrar por categoría" aparece como "Test roto"
