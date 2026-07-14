# Rediseño de `organizacion-form`

Fecha: 2026-07-14

## Objetivo

Llevar `http://localhost:4200/organizacion-form` al mismo lenguaje visual usado en `http://localhost:4200/registro-inventario`, manteniendo la lógica actual del formulario, el listado y la administración de vigencia.

## Cambios aplicados

- Se reemplazó la tarjeta Bootstrap anterior por una shell visual consistente con `registro-inventario`.
- Se agregó un hero superior con contexto de pantalla y métricas rápidas.
- La navegación entre `Datos de la empresa` y `Vigencia de empresas` pasó a chips visuales dentro de una superficie compartida.
- El formulario quedó organizado en una grilla responsive con estados de error integrados en la nueva estética.
- Los listados de organizaciones y vigencia se migraron a paneles con tabla encapsulada, estados vacíos y badges de estado consistentes.
- Se mantuvieron intactos los bindings Angular, validaciones, acciones de edición y actualización de vigencia.

## Archivos involucrados

- `src/app/organizacion/organizacion-form/organizacion-form.component.html`
- `src/app/organizacion/organizacion-form/organizacion-form.component.css`

## Verificación

- `npm run build`
- Resultado: compilación correcta.
- Warnings observados: existentes en módulos `matriz-*`, budget inicial del bundle y dependencias CommonJS del proyecto.
