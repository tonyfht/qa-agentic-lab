# Estabilidad de la suite — 2026-10-21

**Agente:** Detector de inestables ([definición](../../../.claude/agents/qa-detector-flaky.md)).
**Datos:** `stability()` sobre los dos históricos, con ventana de 20 ejecuciones:
- el publicado en GitHub Pages: 15 ejecuciones de CI, de 95 a 346 tests;
- el local: 14 ejecuciones en Windows, de 34 a 365 tests.

**Ejecutado por:** Claude Code (sesión del fundador, QAL-008).

## Resultado

| Histórico | Ejecuciones | Con inestables | Tests inestables |
|---|---|---|---|
| CI (Ubuntu, GitHub Actions) | 15 | 0 | Ninguno |
| Local (Windows, 2 *workers*) | 14 | 1, la última, con 2 de 365 | *Filtrar por categoría* y *El aviso de rango invertido conserva el resto de filtros* |

Fuera del histórico (el E2E suelto no entra en él), las dos ejecuciones locales siguientes tuvieron otros 2
inestables cada una:
- *Cambiar la cantidad y eliminar una línea*;
- *El carrito se conserva al recargar*;
- otros dos de catálogo.

## Análisis por test

| Test | Tasa | Origen | Evidencia | Propuesta |
|---|---|---|---|---|
| *Filtrar por categoría* | 1 de 10 (10 %) | **Entorno** | `Tearing down "context" exceeded the test timeout of 30000ms`. El cuerpo del test pasó; lo que tardó fue cerrar el navegador | Ninguna sobre el test |
| *El aviso de rango invertido…* | 1 de 10 (10 %) | **Entorno** | El mismo mensaje, en la misma ejecución | Ninguna sobre el test |
| Los de carrito y catálogo de las ejecuciones siguientes | 1 vez cada uno | **Entorno** | El mismo mensaje. Cambian los tests, pero no el error | Ninguna sobre los tests |

## Conclusión

La inestabilidad **no es de los tests, sino de la máquina**. Lo dicen tres señales:
- en CI no ha aparecido nunca, en 15 ejecuciones;
- en local cambian los tests afectados, pero el error es siempre el mismo;
- ese error ocurre al cerrar el navegador, después de las aserciones.

## Propuestas

1. **Ningún test entra en cuarentena.** Poner en cuarentena un test sano escondería el problema real y quitaría
   cobertura.
2. **Entorno local:** si la máquina está cargada, ejecutar `npx playwright test --workers=1`. No se cambia la
   configuración compartida, porque en CI no hace falta.
3. **Vigilar** en el informe la sección *¿Es estable la suite?*: si un test aparece inestable en CI, se analiza de
   nuevo con este procedimiento.
