# QAL-007 — Seguridad y cumplimiento

**Estado:** aprobado (mandato del fundador del 2026-10-21: ejecutar la hoja de ruta completa) · **Fecha:** 2026-10-21 ·
**Tipo:** seguridad + cumplimiento + IA

## Why

La tienda ya tiene cuentas, sesiones y pagos simulados. Lo que falta es la seguridad que no se ve en un test
funcional:
- código con patrones peligrosos;
- dependencias vulnerables;
- cabeceras que protegen al navegador;
- lo que encuentra un atacante que "mira" la web desde fuera.

También falta el **cumplimiento**:
- licencias compatibles;
- inventario de componentes (SBOM);
- privacidad: sin rastreadores y solo las cookies imprescindibles.

Son los controles que una auditoría pide como **evidencia**, y aquí se generan solos en cada ejecución. La
seguridad entra antes en el ciclo (*shift-left*) y bloquea igual que un test.

## What Changes

- **Cabeceras de seguridad** en toda la tienda: Content-Security-Policy, `X-Content-Type-Options`, `frame-ancestors`
  / `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`. Se comprueban con escenarios `@security`.
- **Privacidad:**
  - página `/privacidad` con las únicas dos cookies (sesión y carrito), estrictamente necesarias;
  - escenario que comprueba que el navegador no hace ninguna petición a terceros (ni analítica ni rastreadores).
- **Nueva etapa "Seguridad y cumplimiento"** (bloqueante, el mismo comando en local y en CI):
  - **SAST** con Semgrep (reglas `p/default`);
  - **dependencias** con `npm audit`: bloquean las vulnerabilidades altas o críticas de producción, y las de
    desarrollo informan;
  - **licencias** de producción contra una lista permitida, con excepciones versionadas y su motivo;
  - **SBOM** CycloneDX como evidencia de cada ejecución;
  - **DAST pasivo** con OWASP ZAP *baseline* contra la tienda levantada en el propio runner, nunca contra terceros:
    las alertas altas bloquean y las medias solo se aceptan con motivo.

  Sin Docker (ZAP) o con Semgrep sin soporte en el sistema, cada comprobación consta como omitida con el motivo.
- **Hallazgos (`findings`)** con esquema propio en el resultado de cada ejecución: fuente, gravedad, título,
  ubicación y si está aceptado con motivo.
- **Informe:** sección *¿Es segura y cumple?* con los hallazgos por gravedad y fuente, las excepciones aceptadas, el
  SBOM y las licencias.
- **Auditor de seguridad y cumplimiento** (`qa-auditor-seguridad`): prioriza hallazgos y los explica en lenguaje de
  riesgo. Su primera auditoría queda registrada.

## Capabilities

### New Capabilities

- `security`: cabeceras, SAST, dependencias y DAST (`SEC-0xx`).
- `compliance`: licencias, SBOM y privacidad (`CMP-0xx`).

### Modified Capabilities

- `quality-pipeline`: QA-027 (etapa de seguridad y cumplimiento).
- `quality-report`: QA-026 (¿Es segura y cumple?).
- `qa-agents`: QA-049 (Auditor de seguridad y cumplimiento).

## Valor para la demo

- **Cuatro escáneres** (SAST, SCA, DAST y licencias) en el pipeline, con hallazgos normalizados en un solo informe.
- **Excepciones con nombre y motivo, versionadas:** nunca se "apaga" una regla.
- **Evidencia de cumplimiento** que se genera sola en cada ejecución: SBOM, licencias y privacidad.

## Testing scope

- **Tipologías:**
  - seguridad (`@security`: cabeceras, cookies, terceros);
  - SAST, SCA y DAST;
  - cumplimiento (licencias, SBOM);
  - unitarias de los normalizadores y de la política de licencias.
- **Riesgo:** medio. ZAP y Semgrep dependen de herramientas externas y de reglas que cambian. Las reglas aceptadas se
  revisan en cada auditoría.

## Cumplimiento de los requisitos transversales

- **RT-2:** mismos comandos en local y en CI, con omisiones explicadas.
- **RT-3:** hallazgos en el resultado y en el informe.
- **RT-4:** ruta y diagrama actualizados.
- **RT-5:** Auditor de seguridad y cumplimiento.

## Fuera de alcance

- Pruebas de penetración activas (ZAP *full scan*).
- Certificaciones (ISO 27001, PCI DSS). Se enseñan las evidencias, no se certifica nada.
- HSTS: depende del despliegue HTTPS, que no existe en el laboratorio.

## Riesgos

- **CSP compatible con Next.js** → `script-src 'self' 'unsafe-inline'` por los *scripts* en línea que genera Next.
  Queda como alerta media de ZAP aceptada con motivo y con la mejora propuesta (*nonces*).
- **Falsos positivos de Semgrep** → solo con `// nosemgrep: <regla> -- motivo` en la línea.

## Criterios de éxito

1. Todas las páginas devuelven las cabeceras de seguridad y el navegador no contacta con terceros.
2. La etapa "Seguridad y cumplimiento" corre en local y en CI, y deja hallazgos normalizados y el SBOM.
3. Ningún hallazgo alto o crítico sin aceptar, y cada excepción tiene motivo versionado.
4. El informe responde *¿Es segura y cumple?* con datos de CI.
5. El Auditor de seguridad tiene una actuación registrada.

## Impact

`next.config.ts` (cabeceras), `app/privacidad/`, `qa/stages/security.ts`, `qa/checks/{sast,dependencies,licenses,
sbom,dast}.ts`, `compliance/` (política de licencias y excepciones de ZAP), workflow (*job* nuevo), informe,
`.claude/agents/qa-auditor-seguridad.md`. Dependencia: `@cyclonedx/cyclonedx-npm` (desarrollo).
