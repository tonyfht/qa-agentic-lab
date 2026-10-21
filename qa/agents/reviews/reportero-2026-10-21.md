# Resumen ejecutivo — 2026-10-21

**Agente:** Reportero ([definición](../../../.claude/agents/qa-reportero.md)).
**Ejecución:** CI #46 en `main` (`87e75b3`, archivo de QAL-008), con el histórico publicado de 19 ejecuciones.
**Ejecutado por:** Claude Code (sesión del fundador, QAL-009).

## Recomendación: ✔ Sí, se puede salir

Es la recomendación que calcula el código (`releaseVerdict`), con sus tres motivos:
- todas las etapas bloqueantes en verde;
- ningún test inestable;
- los 94 requisitos tienen pruebas.

No discrepo.

## Qué ha cambiado

- **Respecto al primer día:** se ha pasado de 95 a 419 pruebas y de una tienda que solo arrancaba a una compra
  completa (catálogo, carrito con cupones, cuenta, pago simulado y pedidos), cubierta por seis etapas:
  - análisis estático;
  - tienda en el runner;
  - E2E;
  - rendimiento y carga;
  - seguridad y cumplimiento;
  - informe.
- **Respecto a la ejecución anterior** (#43): mismos tests (419) y mismos requisitos cubiertos (94). La duración sube
  de 1 min 50 s a 2 min 42 s. Es variación del runner de GitHub, no de la suite, porque el número de pruebas no
  cambia.
- **Estabilidad:** ningún test inestable en las 19 ejecuciones de CI. Los dos inestables vistos en local eran del
  entorno (Windows con el navegador tardando en cerrarse), según el
  [Detector de inestables](estabilidad-2026-10-21.md).
- **Seguridad:** ningún hallazgo bloqueante. Hay cuatro excepciones aceptadas, todas con motivo, entre ellas CSP
  `unsafe-inline`, CSRF por tokens y libvips LGPL ([auditoría](seguridad-2026-10-21.md)).

## Riesgos para el cliente

Ninguno bloqueante. Lo único que conviene saber antes de una salida real:
- **La CSP admite scripts en línea** por cómo funciona Next.js. El riesgo está acotado: React escapa el contenido y
  ningún dato del usuario se pinta como HTML. La mejora con *nonces* está propuesta.
- **Las pruebas de carga son de 20 usuarios durante 30 s.** Son suficientes para un laboratorio, pero no son una
  prueba de capacidad para tráfico real.

## Para seguir saliendo sin reservas

1. Mantener la cobertura en 94 de 94 cuando lleguen requisitos nuevos. La recomendación pasa a "con reservas" en
   cuanto uno se quede sin pruebas.
2. Revisar las dependencias de desarrollo vulnerables (`braces`, `micromatch`) cuando Dependabot proponga versiones
   corregidas. No afectan a la tienda, pero ensucian la auditoría.
