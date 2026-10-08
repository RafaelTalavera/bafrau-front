# Acciones múltiples en desvíos

## Alcance

El alta y la edición de desvíos permiten registrar varias acciones inmediatas y
varias acciones correctivas sugeridas. Cada acción tiene descripción obligatoria,
responsable opcional y fecha de ejecución opcional.

## Implementación

`DesvioFormComponent` y `DesvioDetailComponent` usan dos `FormArray`:

- `accionesInmediatas`
- `accionesCorrectivasSugeridas`

Cada arreglo inicia con una acción y no permite eliminar su última fila. Los
botones **Agregar** y **Quitar** permiten mantener el orden de carga.

El detalle renderiza las acciones de cada tipo, con su responsable y fecha cuando
están informados. El contrato TypeScript se actualizó para consumir las listas
devueltas por la API.

## Contrato requerido

El backend debe aceptar y devolver las propiedades `accionesInmediatas` y
`accionesCorrectivasSugeridas`, compuestas por objetos con `descripcion`,
`responsable` y `fechaEjecucion`.
