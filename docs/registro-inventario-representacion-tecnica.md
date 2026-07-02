# Registro Inventario: filtro por representacion tecnica

## Problema

La pantalla `registro-inventario` mostraba organizaciones de auditoria ambiental y de representacion tecnica.

La causa era que el componente cargaba el catalogo general con `getAllOrganizaciones()` y solo filtraba por vigencia.

## Correccion aplicada

Se cambio la carga inicial del componente para usar `getOrganizacionesRepresentacionTecnica()`.

Con este ajuste, la pantalla consume el endpoint especifico `/api/organizaciones/representacion-tecnica` y deja de mezclar organizaciones de auditoria.

## Impacto

- `registro-inventario` ahora muestra solo organizaciones vigentes con contrato de representacion tecnica.
- No hubo cambios funcionales en el back para este bug.
