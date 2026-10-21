# Design — QAL-007 Seguridad y cumplimiento

## Context

Ver `proposal.md` y las specs `security` (SEC-001…004) y `compliance` (CMP-001…003), más QA-026, QA-027 y QA-049.

**Punto de partida medido:**
- `npm audit` de producción: 0 vulnerabilidades. De desarrollo: 6 altas, por la cadena `braces` y `micromatch` de
  ESLint y OpenSpec.
- **Licencias de producción:**
  - permisivas (MIT, ISC, BSD, Apache-2.0, 0BSD);
  - CC-BY-4.0 (`caniuse-lite`);
  - LGPL-3.0 (`@img/sharp-*`: libvips, librería nativa de imágenes de Next).
- **Semgrep 1.180** falla en Windows dentro de `semgrep-core` (soporte beta). En Linux funciona.

## Goals / Non-Goals

**Goals:** cinco controles dentro del orquestador, un formato único de hallazgos y excepciones versionadas con motivo.

**Non-Goals:** escaneo activo (ZAP *full*), HSTS sin HTTPS y gestión de vulnerabilidades fuera del repositorio.

## Decisions

### 1. Cabeceras en `next.config.ts`

`headers()` para `/:path*`:
- **CSP:** `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'
  data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  object-src 'none'`.
- **`'unsafe-eval'` solo en desarrollo**, porque lo necesita el refresco en caliente de Next.
- **El resto de cabeceras**, fijas.

*Alternativa aplazada:* CSP con *nonces* vía `proxy.ts`. Quitaría `'unsafe-inline'`, pero obliga a que todo el
renderizado sea dinámico. Queda como mejora propuesta.

### 2. Formato de hallazgos (`findings`)

```
{ source: 'semgrep' | 'npm-audit' | 'licenses' | 'zap', severity: 'critical' | 'high' | 'medium' | 'low' | 'info',
  title, location?, scope?: 'production' | 'development', accepted?: string }
```

`accepted` lleva el motivo cuando hay excepción. Estrecha el `unknown[]` de QAL-001: los registros antiguos traen
`[]`, así que sigue siendo `schemaVersion: 1`.

**Regla de bloqueo** (una función pura, `blockingFindings()`), que bloquea si no hay `accepted` y:
- es `critical` o `high`;
- o es `medium` de ZAP;
- o es una licencia no permitida.

Las vulnerabilidades de desarrollo nunca bloquean (`scope: 'development'`).

### 3. Las cinco comprobaciones (`qa/checks/`)

| Comprobación | Requisito | Herramienta | Normalización |
|---|---|---|---|
| SAST | SEC-002 | `semgrep scan --config p/default --json --metrics=off` | ERROR → high, WARNING → medium, INFO → low. En Windows: omitida con motivo |
| Dependencias | SEC-003 | `npm audit --json` (todo) y `--omit=dev` (producción) | Una por paquete vulnerable, con su gravedad y `scope` |
| Licencias | CMP-001 | `npm ls --omit=dev --all --json` + `package.json` de cada paquete instalado | Contra `compliance/licencias.json` (permitidas + excepciones por patrón de paquete con motivo) |
| SBOM | CMP-002 | `npx @cyclonedx/cyclonedx-npm --omit dev` | Fichero en la ejecución y número de componentes en `metrics.sbom` |
| DAST | SEC-004 | `docker run --network host ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t … -J` | Riesgo ZAP → gravedad; medias aceptadas en `compliance/zap-aceptadas.json` |

Cada comprobación produce un test trazado a su requisito (pasa, falla u omitida con motivo) y sus hallazgos.

### 4. Etapa `security` ("Seguridad y cumplimiento")

- **Dependencias y orden:** depende de `build` (DAST necesita la tienda) y va después de `performance`.
- **Cómo trabaja:** levanta la tienda en el 3410, ejecuta las cinco comprobaciones, aplica `blockingFindings()` y deja
  `findings` y `metrics.sbom` en el parcial.
- **En CI:**
  - *job* "5 · Seguridad y cumplimiento", con Semgrep instalado con `pip`, Docker del runner y el SBOM como
    artefacto;
  - el informe pasa a 6 y la publicación a 7;
  - se actualizan los checks obligatorios.

### 5. Privacidad (CMP-003)

- **Página `/privacidad`:** una tabla de las dos cookies (nombre, finalidad, duración, tipo: necesaria), con enlace
  en un pie de página nuevo.
- **Escenario `@security`:** recorre portada, catálogo, ficha y carrito escuchando `page.on('request')`, y exige
  que todas las peticiones vayan a la propia tienda.

### 6. Informe (QA-026)

Sección *¿Es segura y cumple?*:
- indicadores de hallazgos bloqueantes, altos y medios, aceptados, componentes del SBOM y licencias;
- barras apiladas fuente × gravedad;
- tabla de excepciones aceptadas con su motivo;
- estado vacío si la etapa no se ejecutó.

### 7. Auditor de seguridad y cumplimiento (QA-049)

`qa-auditor-seguridad.md`: prioriza por riesgo real (¿se distribuye? ¿es explotable desde fuera? ¿hay dato
personal?), revisa que cada excepción siga justificada y propone correcciones. Tiene prohibido añadir excepciones.

## Gherkin

```gherkin
@security @api @p1 @SEC-001
Scenario: La portada y la API devuelven las cabeceras de seguridad
```

## Risks / Trade-offs

- **[ZAP alerta "CSP: script-src unsafe-inline"]** → se acepta con motivo y con la mejora con *nonces* propuesta,
  visible en el informe.
- **[El paquete de licencias varía por plataforma (sharp)]** → las excepciones van por patrón (`@img/sharp-*`).
- **[La imagen de ZAP tarda en descargarse en CI]** → unos 30 s. Es asumible.

## Migration Plan

Sin datos. Las excepciones de ZAP y de licencias nacen con lo medido en la primera ejecución de CI.
