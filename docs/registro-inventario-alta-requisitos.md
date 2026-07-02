# Registro inventario: alta de requisitos nuevos

## Problema

En `registro-inventario`, al intentar crear un requisito nuevo desde el front, el guardado podia frenarse antes de llegar al backend aunque los datos fueran validos.

Los casos observados fueron:

- fecha de vencimiento cargada en formato `dd/MM/yyyy`
- item con `documentoId` seleccionado pero sin datos derivados hidratados en memoria
- payload sin bandera explicita de `deleted`

## Correccion aplicada

- Se hidratan `nombre`, `juridiccion` y `observacionesDocumento` al seleccionar documento.
- Se normalizan fechas de entrada para aceptar `yyyy-MM-dd` y `dd/MM/yyyy`.
- La validacion previa al guardado se concentra en `documentoId` y `vencimiento` interpretable.
- El payload de cada item ahora envia `deleted: false` en altas y ediciones.

## Impacto

- `Guardar requisito` deja de bloquearse por estados intermedios del formulario.
- `Crear registro` envia items nuevos con una carga consistente para el backend.
