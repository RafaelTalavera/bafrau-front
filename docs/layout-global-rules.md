# Reglas globales de layout (Nav, Navbar, Footer)

Este proyecto usa una estructura de marco visual estandar para que todas las vistas se rendericen de forma equilibrada:

`<app-nav></app-nav>` + `<div class="content-wrapper">...</div>` + `<app-footer></app-footer>`

## Objetivo

- Evitar que `navbar` o `footer` tapen contenido.
- Mantener los mismos offsets y espaciados en todas las pantallas.
- Eliminar estilos inline repetidos (`height: 100vh`, `position: fixed`, etc.).

## Tokens globales

Definidos en `src/styles.css`:

- `--layout-header-height`
- `--layout-sidebar-width`
- `--layout-footer-height`
- `--layout-content-gap`
- `--layout-content-gutter`

Estos tokens gobiernan el espaciado global del contenido y la posicion del shell.

## Reglas aplicadas

- `src/styles.css` define el comportamiento base de `.content-wrapper` dentro de `.wrapper`.
- `src/app/gobal/nav/nav.component.css` controla posicion fija y capas (`z-index`) de header/sidebar.
- `src/app/gobal/footer/footer.component.css` controla footer fijo y alineado al sidebar en desktop.
- En mobile (`max-width: 991.98px`), sidebar y footer pasan a reglas compactas para no invadir el contenido.

## Regla de mantenimiento

- No usar estilos inline para layout en las vistas.
- Evitar redefinir `.content-wrapper` para `margin-left`, `padding-top`, `height: 100vh`.
- Si una pantalla necesita scroll interno, usar `class="content-wrapper layout-scroll-y"` en lugar de hardcodear altura fija.

## Checklist para nuevas pantallas

1. Usar el orden: `app-nav` -> `.content-wrapper` -> `app-footer`.
2. No agregar `position: fixed` ni `height: 100vh` en el HTML de la pantalla.
3. Si hay ajustes globales, modificarlos solo en `src/styles.css` (tokens/layout base).
