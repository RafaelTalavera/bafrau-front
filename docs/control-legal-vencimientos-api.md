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

## Reglas aplicadas en el registro

- El día de presentación no integra el plazo: `2026-10-01 + 5` corridos se
  previsualiza como `2026-10-06`.
- Para días hábiles se omiten sábados, domingos y las fechas recibidas en días
  no laborables.
- Cambiar presentación, plazo o modalidad actualiza la previsualización, sin
  modificar los días de aviso.
- Elegir «Sin plazo» deshabilita el cálculo, vacía el vencimiento y deja los
  días de aviso en cero.
- Los registros anteriores que no contienen los campos nuevos conservan su
  vencimiento editable y no se fuerzan a recalcular.

## Administración desde el registro legal

El botón «Configurar vencimientos» abre la sección de administración del
registro seleccionado. Desde allí se puede consultar y crear plazos, consultar
y cargar días no laborables, y registrar su alcance. Los nuevos plazos se
agregan al selector sin recargar la página; los nuevos días no laborables
recalculan las previsualizaciones automáticas abiertas. Un `409` al crear un
plazo se informa como «El plazo ya existe».
