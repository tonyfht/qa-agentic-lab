# Escenarios del agente Analista (interfaz) y del Agente de API (contrato y seguridad) para la spec `account` (QAL-005).
@account
Feature: Cuenta de cliente
  Como cliente de La Tienda en Casa
  quiero una cuenta propia y segura
  para comprar y consultar mis pedidos

  @ACC-001 @e2e @p1
  Scenario: Registro correcto en la página
    When me registro en la página como "Ana"
    Then la cabecera saluda "Hola, Ana"

  @ACC-001 @api @p1
  Scenario: El correo ya registrado no distingue mayúsculas
    When me registro por la API con el correo "CLIENTE@ejemplo.test"
    Then la API responde 409
    And el error explica "Ya existe una cuenta con ese correo"
    And la respuesta cumple el contrato publicado

  # Clases de equivalencia de contraseñas inválidas: sin número, sin letra, demasiado corta.
  @ACC-001 @api @p2 @clases-equivalencia
  Scenario Outline: Contraseñas que no cumplen la política
    When me registro por la API con la contraseña "<contraseña>"
    Then la API responde 400
    And el error del campo "password" es "La contraseña necesita al menos 8 caracteres, una letra y un número"
    And la respuesta cumple el contrato publicado

    Examples:
      | contraseña |
      | casacasa   |
      | 12345678   |
      | Casa1      |

  @ACC-002 @e2e @p1 @smoke
  Scenario: Entrar y salir con el cliente de ejemplo
    When abro "/cuenta/entrar"
    And entro en la página con el cliente de ejemplo
    Then la cabecera saluda "Hola, Cliente de Prueba"
    When cierro la sesión
    Then la cabecera ofrece "Entrar"

  # El mismo mensaje con un correo que existe y con uno que no: no se revela qué correos están registrados.
  @ACC-002 @api @p1 @clases-equivalencia
  Scenario Outline: Credenciales incorrectas
    When entro por la API con "<correo>" y "<contraseña>"
    Then la API responde 401
    And el error explica "Correo o contraseña incorrectos"
    And la respuesta cumple el contrato publicado

    Examples:
      | correo               | contraseña |
      | cliente@ejemplo.test | Erronea123 |
      | nadie@ejemplo.test   | Casa2026   |

  @ACC-003 @api @p1
  Scenario: La cookie de sesión es HttpOnly y SameSite=Lax
    When entro por la API con "cliente@ejemplo.test" y "Casa2026"
    Then la API responde 200
    And la cookie "session" es HttpOnly y SameSite=Lax
    And la respuesta cumple el contrato publicado

  @ACC-004 @e2e @p1
  Scenario: El checkout sin sesión lleva a entrar y vuelve
    When abro "/checkout"
    Then estoy en la página "/cuenta/entrar"
    When entro en la página con el cliente de ejemplo
    Then estoy en la página "/checkout"

  @ACC-004 @e2e @p2
  Scenario: Un destino externo tras entrar se ignora
    When abro "/cuenta/entrar?next=https://otro-sitio.test"
    And entro en la página con el cliente de ejemplo
    Then estoy en la página "/cuenta/pedidos"

  @ACC-004 @api @p1
  Scenario: La API de pedidos sin sesión responde 401
    When pido por la API mis pedidos
    Then la API responde 401
    And la respuesta cumple el contrato publicado
