# Descripcion breve de organizacion

Se agrego el campo `descripcion` en el formulario `organizacion-form`.

## Cambios

- Se incorporo un `textarea` para cargar una descripcion breve de la empresa.
- Los campos `domicilio real` y `domicilio legal` pasaron a ocupar un renglon completo cada uno.
- La descripcion ahora se muestra en `registro-inventario` debajo del nombre de la empresa cuando existe contenido.
- Si la empresa no tiene descripcion cargada, no se muestra ningun texto de reemplazo.

## Archivos principales

- `src/app/organizacion/organizacion-form/organizacion-form.component.ts`
- `src/app/organizacion/organizacion-form/organizacion-form.component.html`
- `src/app/organizacion/organizacion-form/organizacion-form.component.css`
- `src/app/organizacion/models/organizacion.model.ts`
- `src/app/legal/inventario-registro/inventario-registro.component.ts`
- `src/app/legal/inventario-registro/inventario-registro.component.html`
- `src/app/legal/models/control.model.ts`
