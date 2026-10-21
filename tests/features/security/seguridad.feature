# Escenarios del agente Analista para las specs `security` y `compliance` (QAL-007). El SAST, las dependencias, las
# licencias, el SBOM y el DAST corren en la etapa "Seguridad y cumplimiento"; aquí, lo que se comprueba desde fuera.
@security @p1
Feature: Seguridad y privacidad desde el navegador
  Como cliente
  quiero que la tienda me proteja aunque no lo vea
  para comprar sin que nadie me rastree ni suplante la web

  @SEC-001
  Scenario: La portada y la API devuelven las cabeceras de seguridad
    When pido la portada sin navegador
    Then la respuesta tiene las cabeceras de seguridad
    When pido por la API los artículos con "page=1"
    Then la respuesta de la API tiene "X-Content-Type-Options" con "nosniff"

  @CMP-003
  Scenario: El navegador no habla con terceros
    When recorro la portada, el catálogo, una ficha y el carrito
    Then todas las peticiones del navegador van a la propia tienda

  @CMP-003
  Scenario: Las cookies están declaradas en la página de privacidad
    When abro "/privacidad"
    Then la tabla de cookies describe "session" y "cart_id" como necesarias

  @SEC-005
  Scenario: Los formularios de cuenta no ponen las credenciales en la URL
    When abro "/cuenta/entrar"
    Then el formulario "Entrar" se envía por POST
    When abro "/cuenta/registro"
    Then el formulario "Registro" se envía por POST

  @SEC-005
  Scenario: El formulario de pago no pone la tarjeta en la URL
    Given un cliente nuevo con sesión
    And un carrito con "taza-desayuno-xl x1"
    When abro "/checkout"
    Then el formulario "Pago" se envía por POST
