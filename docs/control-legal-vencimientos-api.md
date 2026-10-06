# Vencimientos automáticos de Control Legal: contrato frontend

La URL base se obtiene exclusivamente de `environment.apiUrl`; el entorno local
usa `http://localhost:8081/api`.

## Ítem de control

Además de los campos existentes, un ítem puede incluir:

- `plazoVencimientoDias`: número de días configurado.
- `modalidadVencimiento`: `CORRIDOS` o `HABILES`.
- `sinPlazo`: desactiva el cálculo y envía `vencimiento: null`.
- `vencimientoManual`: permite enviar una fecha de vencimiento elegida por el usuario.

El backend es la fuente de verdad de `vencimiento` al crear o actualizar un
control. El frontend sólo calcula una previsualización.

## Configuración

| Recurso | Lectura | Alta |
| --- | --- | --- |
| Plazos | `GET /controles/vencimientos/plazos` | `POST /controles/vencimientos/plazos` con `{ "dias": number }` |
| Días no laborables | `GET /controles/vencimientos/dias-no-laborables` | `POST /controles/vencimientos/dias-no-laborables` |

Un día no laborable usa `fecha`, `alcance` (`NACIONAL`, `PROVINCIAL` o
`MUNICIPAL`), `municipio` opcional y `descripcion` opcional. Para alcance
`MUNICIPAL`, `municipio` es obligatorio.
