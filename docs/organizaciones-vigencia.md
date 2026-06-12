# Organizaciones vigentes

## Objetivo

Permitir administrar empresas vigentes y no vigentes sin eliminarlas, reduciendo la carga visual del sistema y ocultando empresas inactivas de las pantallas operativas.

## Cambios aplicados

- En `organizacion-form` se reemplazo la eliminacion por una gestion de vigencia.
- La pantalla se dividio en dos vistas:
  - `Datos de la empresa`
  - `Vigencia de empresas`
- `Datos de la empresa` muestra solo organizaciones vigentes.
- `Vigencia de empresas` muestra todas las organizaciones para permitir marcar `vigente` o `no vigente`.
- La edicion carga la organizacion completa antes de abrir el formulario.
- Se agrego el consumo del endpoint `PATCH /api/organizaciones/{id}/vigencia`.

## Criterio funcional

- Las empresas no se borran.
- Una empresa no vigente deja de aparecer en reportes, combos y vistas operativas.
- La reactivacion se hace desde la vista de vigencia.
