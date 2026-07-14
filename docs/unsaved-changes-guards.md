# Unsaved Changes Guards

## Alcance

Este ajuste agrega confirmacion antes de salir de pantallas con cambios pendientes en:

- `usuarios`
- `registro-inventario`

## Comportamiento

- Si el usuario modifica datos y navega a otra ruta interna, la app muestra un modal de `SweetAlert2`.
- Si el usuario intenta volver al listado o cambiar de entidad dentro de la misma pantalla, tambien se pide confirmacion.
- Si el usuario recarga la pagina o cierra la pestana, el navegador muestra su confirmacion nativa.

## Implementacion

- Se creo el guard reutilizable `src/app/guards/pending-changes.guard.ts`.
- `usuarios` implementa deteccion de cambios sobre el formulario template-driven.
- `registro-inventario` compara el estado cargado inicialmente contra un snapshot actual de los controles editables.
- Las rutas usan `canDeactivate` para frenar la navegacion cuando hay cambios sin guardar.

## Archivos tocados

- `src/app/guards/pending-changes.guard.ts`
- `src/app/app-routing.module.ts`
- `src/app/usuarios/form-usuario/form-usuario.component.ts`
- `src/app/usuarios/usuarios.component.ts`
- `src/app/legal/inventario-registro/inventario-registro.component.ts`
