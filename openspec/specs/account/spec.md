# account Specification

## Purpose

Define la cuenta de cliente de La Tienda en Casa: registro, inicio y cierre de sesión, y qué partes de la tienda
exigen haber entrado.

## Requirements

### Requirement: ACC-001 Registro de cliente
Una persona SHALL poder registrarse con nombre, correo y contraseña. El correo SHALL ser válido y único, sin distinguir mayúsculas. La contraseña SHALL tener al menos 8 caracteres con al menos una letra y un número. Tras registrarse, la sesión SHALL quedar iniciada.

#### Scenario: Registro correcto
- **WHEN** una persona se registra con "Ana", "ana@ejemplo.test" y "Casa2026"
- **THEN** su cuenta queda creada y ve "Hola, Ana" en la cabecera

#### Scenario: Correo ya registrado
- **GIVEN** una cuenta con el correo "cliente@ejemplo.test"
- **WHEN** alguien se registra con "CLIENTE@ejemplo.test"
- **THEN** se rechaza con "Ya existe una cuenta con ese correo"

#### Scenario: Contraseña débil
- **WHEN** alguien se registra con la contraseña "casacasa"
- **THEN** se rechaza indicando que necesita al menos 8 caracteres, una letra y un número

### Requirement: ACC-002 Inicio y cierre de sesión
Un cliente SHALL poder iniciar sesión con su correo y contraseña y cerrarla. Unas credenciales incorrectas SHALL rechazarse con el mismo mensaje tanto si el correo existe como si no, para no revelar qué correos están registrados.

#### Scenario: Inicio de sesión correcto
- **WHEN** el cliente entra con "cliente@ejemplo.test" y su contraseña
- **THEN** ve su nombre en la cabecera y el enlace "Mis pedidos"

#### Scenario: Credenciales incorrectas
- **WHEN** alguien entra con un correo registrado y una contraseña errónea, o con un correo no registrado
- **THEN** en ambos casos ve "Correo o contraseña incorrectos"

#### Scenario: Cerrar sesión
- **GIVEN** un cliente con la sesión iniciada
- **WHEN** cierra la sesión
- **THEN** la cabecera vuelve a mostrar "Entrar" y sus pedidos dejan de ser accesibles

### Requirement: ACC-003 Sesión segura
La sesión SHALL viajar en una cookie `HttpOnly` con `SameSite=Lax` y un identificador aleatorio que no contiene datos del cliente, y SHALL caducar a los 7 días; una sesión caducada equivale a no tener sesión. La contraseña SHALL guardarse solo como hash con sal.

#### Scenario: Cookie de sesión
- **WHEN** un cliente inicia sesión
- **THEN** la respuesta establece la cookie de sesión con `HttpOnly` y `SameSite=Lax`

#### Scenario: La contraseña no se guarda en claro
- **WHEN** se registra una cuenta
- **THEN** la base de datos guarda un hash con sal distinto para dos cuentas con la misma contraseña

### Requirement: ACC-004 Zonas que exigen sesión
El checkout y los pedidos SHALL exigir sesión iniciada. En la interfaz, quien no la tenga SHALL ir a "Entrar" y volver después a donde iba, solo si es una ruta interna de la tienda; la API SHALL responder 401.

#### Scenario: Checkout sin sesión en la interfaz
- **WHEN** alguien sin sesión abre el checkout
- **THEN** va a la página de entrar y, tras entrar, vuelve al checkout

#### Scenario: Destino externo tras entrar
- **WHEN** alguien entra desde un enlace con destino "https://otro-sitio.test"
- **THEN** tras entrar va a sus pedidos y no a la web externa

#### Scenario: API de pedidos sin sesión
- **WHEN** se pide la lista de pedidos por la API sin sesión
- **THEN** la API responde 401
