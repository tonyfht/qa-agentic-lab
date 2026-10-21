# Spec Delta — security

## Purpose

Define los controles de seguridad de La Tienda en Casa que no cubre un test funcional: cabeceras que protegen al
navegador, análisis del código, dependencias vulnerables y análisis dinámico de la web desde fuera.

## ADDED Requirements

### Requirement: SEC-001 Cabeceras de seguridad
Todas las páginas y respuestas de la API SHALL incluir: `Content-Security-Policy` con `frame-ancestors 'none'`; `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` sin cámara, micrófono ni geolocalización; y `same-origin` en COOP y CORP con COEP `require-corp`. SHALL NOT incluir `X-Powered-By`.

#### Scenario: Página con cabeceras
- **WHEN** se pide la portada
- **THEN** la respuesta incluye las ocho cabeceras con esos valores y ninguna `X-Powered-By`

#### Scenario: Respuesta de API con cabeceras
- **WHEN** se pide `GET /api/products`
- **THEN** la respuesta incluye `X-Content-Type-Options: nosniff` y la política de seguridad de contenido

### Requirement: SEC-002 Análisis estático de seguridad
El código SHALL analizarse con Semgrep en cada ejecución. Un hallazgo de gravedad alta SHALL bloquear salvo que la línea lo acepte con `nosemgrep` y su motivo. Si Semgrep no puede ejecutarse en el sistema, la comprobación SHALL constar como omitida con el motivo.

#### Scenario: Código sin hallazgos altos
- **WHEN** se analiza el repositorio
- **THEN** no hay hallazgos altos sin aceptar y los demás quedan en el resultado

#### Scenario: Hallazgo alto
- **GIVEN** una línea con un patrón de inyección detectado como alto
- **WHEN** se analiza
- **THEN** la comprobación falla indicando regla, fichero y línea

### Requirement: SEC-003 Dependencias sin vulnerabilidades graves
Las dependencias de producción no SHALL tener vulnerabilidades conocidas de gravedad alta o crítica. Las de desarrollo SHALL registrarse como hallazgos informativos sin bloquear.

#### Scenario: Producción limpia
- **WHEN** se auditan las dependencias de producción
- **THEN** no hay vulnerabilidades altas ni críticas

#### Scenario: Vulnerabilidad en desarrollo
- **GIVEN** una dependencia de desarrollo con una vulnerabilidad alta
- **WHEN** se auditan las dependencias
- **THEN** aparece como hallazgo informativo de desarrollo y la etapa no falla por ella

### Requirement: SEC-004 Análisis dinámico pasivo
La tienda levantada en el propio entorno de pruebas SHALL analizarse con OWASP ZAP baseline. Una alerta de riesgo alto SHALL bloquear; una de riesgo medio SHALL bloquear salvo que esté aceptada en la lista versionada con su motivo. Sin Docker disponible, la comprobación SHALL constar como omitida con el motivo.

#### Scenario: Sin alertas bloqueantes
- **WHEN** se ejecuta ZAP baseline contra la tienda
- **THEN** no hay alertas altas ni medias sin aceptar, y todas quedan en el resultado con su riesgo

#### Scenario: Alerta media no aceptada
- **GIVEN** una alerta de riesgo medio que no está en la lista de aceptadas
- **WHEN** se evalúa el resultado de ZAP
- **THEN** la comprobación falla indicando la alerta y su identificador

### Requirement: SEC-005 Datos sensibles fuera de la URL
Los formularios que envían credenciales o datos de pago (entrar, registro y pago) SHALL declarar `method="post"`, de modo que, si el envío ocurre antes de que cargue JavaScript, el navegador no ponga esos datos en la URL, en el historial ni en los registros del servidor.

#### Scenario: Formularios de cuenta
- **WHEN** se abren las páginas de entrar y de registro
- **THEN** su formulario declara `method="post"`

#### Scenario: Formulario de pago
- **GIVEN** un cliente con sesión y un artículo en el carrito
- **WHEN** se pide la página de pago
- **THEN** el formulario de pago declara `method="post"`

### Requirement: SEC-006 Escrituras desde otro sitio rechazadas
La API SHALL rechazar con 403 toda petición que modifique datos (cualquier método salvo GET, HEAD y OPTIONS) cuando el navegador indique que llega desde otro sitio: `Sec-Fetch-Site: cross-site` o, sin esa cabecera, un `Origin` cuyo host no es el de la tienda. Es defensa en profundidad contra CSRF, además de las cookies `SameSite=Lax`.

#### Scenario: Escritura desde un sitio ajeno
- **WHEN** se añade un artículo al carrito por la API con `Origin: https://atacante.example`
- **THEN** la API responde 403 explicando que la petición llega desde otro sitio

#### Scenario: Escritura desde la propia tienda
- **WHEN** se añade un artículo al carrito por la API con el origen de la tienda
- **THEN** la API responde 200
