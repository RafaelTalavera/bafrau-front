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

Un día no laborable usa `fecha`, `alcance` (`NACIONAL` o `PROVINCIAL`),
`provinciaCodigo` y `descripcion`. Para alcance `PROVINCIAL`,
`provinciaCodigo` es obligatorio y debe usar ISO 3166-2:AR, por ejemplo
`AR-Q` para Neuquén. Los feriados municipales no forman parte del cálculo.

El documento legal expone `provinciaCodigo`. Es la provincia que determina qué
feriados provinciales se consideran en los vencimientos hábiles del requisito.

### Sincronización central

`POST /controles/vencimientos/calendario/sincronizar?desde=2026&hasta=2027`
sincroniza el calendario nacional y provincial en el backend. Devuelve la
fuente, fecha de sincronización, cantidades nacionales/provinciales y totales
creados, actualizados y omitidos. Los vencimientos usan siempre la copia local
persistida; el frontend no consulta proveedores externos.

## Reglas aplicadas en el registro

- El día de presentación no integra el plazo: `2026-10-01 + 5` corridos se
  previsualiza como `2026-10-06`.
- Para días hábiles se omiten sábados, domingos, los feriados nacionales y los
  provinciales que coinciden con `provinciaCodigo` del documento.
- Cambiar presentación, plazo o modalidad actualiza la previsualización, sin
  modificar los días de aviso.
- Elegir «Sin plazo» deshabilita el cálculo, vacía el vencimiento y deja los
  días de aviso en cero.
- Una excepción manual mantiene la fecha elegida, aunque después se ajusten la
  presentación, el plazo o la modalidad.
- Los registros anteriores que no contienen los campos nuevos conservan su
  vencimiento editable y no se fuerzan a recalcular.

## Administración desde el registro legal

El botón «Configurar vencimientos» abre la sección de administración del
registro seleccionado. Desde allí se sincroniza el calendario central, se
pueden consultar feriados y registrar ajustes excepcionales nacionales o
provinciales. Los nuevos plazos se agregan al selector sin recargar la página;
los días no laborables recalculan las previsualizaciones automáticas abiertas.
Un `409` al crear un plazo se informa como «El plazo ya existe».
