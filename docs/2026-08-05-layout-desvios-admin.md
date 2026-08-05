# Cambios del 2026-08-05

## Alcance

Se consolidaron cambios de layout, navegación, autenticación y vistas administrativas para unificar el comportamiento del sistema dentro de un único marco visual compuesto por:

- encabezado fijo
- menú lateral fijo
- footer fijo
- área central de contenido con scroll propio

## Layout y shell global

- Se centralizó el marco principal en `ShellLayoutComponent`.
- Las rutas autenticadas pasaron a renderizar dentro del shell compartido.
- Se eliminaron desplazamientos y márgenes heredados de AdminLTE que duplicaban offsets entre sidebar, header y footer.
- Se unificó el cálculo del ancho útil mediante variables CSS globales y el offset dinámico del sidebar.
- La pantalla `/menu` pasó a usar el mismo `content-wrapper` del resto del sistema.

## Navegación

- El menú lateral dejó de depender del comportamiento automático de plugins jQuery para el colapso principal.
- Se agregó control explícito para:
  - colapso manual del sidebar
  - expansión por hover cuando el menú está resumido
  - apertura de secciones según la ruta activa
- Se incorporó la sección de `Desvios` al menú lateral y al menú de accesos.

## Autenticación e infraestructura

- El interceptor HTTP quedó conectado vía `withInterceptorsFromDi()`.
- Se unificó el uso del token bajo la clave `jwt_token`.
- La normalización de roles ahora contempla `role`, `roles` y `authorities`.
- Se alineó la navegación del navbar/login con las rutas actuales (`/menu`, `/login`).

## Nuevas vistas y mejoras funcionales

### Desvíos

Se agregó un módulo inicial de seguimiento de desvíos con:

- listado
- alta
- detalle
- modelo y servicio base

### Usuarios

Se rediseñó la gestión de usuarios para concentrar:

- formulario de alta/edición
- métricas rápidas
- tabla con estado visible
- acciones de bloqueo/desbloqueo

### Semáforo de requisitos

Se renovó la presentación para mejorar:

- lectura del estado
- filtros visuales
- búsqueda
- tabla sticky y responsive

## Validación

Los cambios fueron verificados con:

```bash
npm run build
```

La compilación finalizó correctamente. Persisten advertencias previas del proyecto sobre:

- optional chaining redundante en templates Angular
- presupuesto de bundle
- dependencias CommonJS de librerías externas
