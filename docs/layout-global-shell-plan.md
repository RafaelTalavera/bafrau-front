# Plan de layout global (Nav + Sidebar + Footer)

## 1) Diagnostico actual

Problema observado:
- `app-nav` y `app-footer` se renderizan dentro de muchas pantallas.
- Cada pantalla define su propio contenedor (`wrapper/content-wrapper`, `d-flex`, `container`, margenes, paddings).
- El CSS global depende de un selector especifico: `body .wrapper .content-wrapper`.
- Cuando una vista no cumple ese arbol HTML, se rompe el offset del navbar/sidebar/footer.

Evidencia en el repo:
- `src/app/app.component.html` solo tiene `<router-outlet>`.
- Hay 67 ocurrencias de `app-nav/app-footer` en templates (`rg "<app-nav|<app-footer"`).
- Existen pantallas con layout distinto (ej: `menu-table`, `reporte-legal-organizacion`) que aplican parches locales de espaciado.

Conclusion:
- El problema no es un componente aislado; es un problema de arquitectura de layout compartido.

## 2) Objetivo de arquitectura

Centralizar layout comun en un solo componente shell y dejar a cada pagina solo su contenido.

Estructura objetivo:
- `AppComponent`:
  - `router-outlet` (sin nav/footer hardcodeados).
- `ShellLayoutComponent`:
  - `<app-nav>`
  - `<main class="app-content"><router-outlet></router-outlet></main>`
  - `<app-footer>`
- Rutas publicas (ej: login) fuera del shell.
- Rutas privadas dentro del shell (children).

Beneficios:
- Consistencia visual en todas las pantallas.
- Eliminacion de codigo duplicado en templates.
- Menor costo de mantenimiento (un solo punto para corregir layout).

## 3) Estrategia de implementacion (secuencial)

## Fase 0 - Preparacion (sin cambios funcionales)
- Crear rama: `refactor/layout-shell-global`.
- Congelar cambios de estilos globales no relacionados.
- Definir lista de rutas publicas y privadas.

Criterio de salida:
- Lista validada de rutas que usan shell y rutas que no.

## Fase 1 - Crear shell base
- Crear `src/app/layout/shell-layout/` (standalone):
  - `shell-layout.component.ts/html/css`.
- Mover estructura comun (`app-nav`, `main`, `app-footer`) al shell.
- Definir clase estable para contenido (ej: `.app-content`) en lugar de depender de `.wrapper .content-wrapper`.

Criterio de salida:
- Shell renderiza correctamente una ruta piloto.

## Fase 2 - Reorganizar routing
- En `app-routing.module.ts`:
  - Mantener `/login` fuera del shell.
  - Crear grupo de rutas privadas:
    - `path: ''`, `component: ShellLayoutComponent`, `canActivateChild` si aplica.
    - Todas las paginas de negocio como `children`.
- Eliminar duplicados de ruta detectados (ej: `organizacion-form` aparece 2 veces).
- Mantener `**` una sola vez al final.

Criterio de salida:
- Navegacion funcional y guards intactos.

## Fase 3 - Migracion de vistas (lotes)
- Lote A (bajo riesgo):
  - `menu-table`, `usuarios`, `organizacion-form`.
- Lote B (riesgo medio):
  - modulos de formulario inicial y legal.
- Lote C (alto riesgo):
  - vistas extensas de matriz e informe.

En cada vista:
- Eliminar `<app-nav>` y `<app-footer>`.
- Eliminar wrappers heredados solo usados para layout global.
- Conservar solo estructura de contenido propio.

Criterio de salida:
- Cada lote compila sin errores y sin regresiones visuales criticas.

## Fase 4 - Limpieza de CSS global
- Reemplazar reglas acopladas:
  - de: `body .wrapper .content-wrapper`
  - a: clases estables del shell (`.app-shell`, `.app-content`).
- Definir tokens en `:root` para offsets:
  - header, sidebar, footer, gutters.
- Eliminar hacks por pagina para separar contenido de navbar/footer cuando ya no sean necesarios.

Criterio de salida:
- No quedan reglas globales dependientes de markup por pantalla.

## Fase 5 - Hardening y documentacion final
- Actualizar `README` con:
  - convencion de layout,
  - cuando usar shell y cuando no.
- Agregar checklist de PR para nuevas rutas.
- Capturas de referencia desktop/mobile para baseline visual.

Criterio de salida:
- Documentacion suficiente para evitar volver a duplicar nav/footer.

## 4) Plan de pruebas

## 4.1 Pruebas tecnicas
- Build:
  - `npm run build`
- Lint (si esta configurado):
  - `npm run lint`
- Unit tests (si existen):
  - `npm test -- --watch=false`

## 4.2 Pruebas funcionales manuales (minimas)
- Login y redireccion post-login a `/menu`.
- Navegacion por rutas principales:
  - matriz, informe, legal, organizacion, usuarios.
- Logout desde nav.
- Responsive:
  - 360x800, 768x1024, 1366x768.

## 4.3 Criterios visuales de aceptacion
- Footer siempre alineado y con ancho correcto (con y sin sidebar).
- Contenido nunca oculto bajo navbar/footer.
- Sidebar no tapa contenido en desktop.
- En mobile, comportamiento colapsado consistente.

## 5) Riesgos y mitigaciones

Riesgo:
- Romper pantallas que dependen de espaciados hardcodeados.
Mitigacion:
- Migracion por lotes + screenshots antes/despues.

Riesgo:
- Interaccion con scripts de AdminLTE (`pushmenu/treeview`).
Mitigacion:
- Probar inicializacion tras cambio de contenedor global.

Riesgo:
- Vistas especiales (preview/impresion) que no deberian mostrar shell.
Mitigacion:
- Mantener rutas especiales fuera del shell via ruta publica dedicada.

## 6) Checklist por PR

- [ ] La vista no incluye `app-nav` ni `app-footer` localmente.
- [ ] La vista compila dentro del `ShellLayoutComponent`.
- [ ] No se agregaron hacks de `padding-top`/`padding-bottom` para compensar navbar/footer.
- [ ] Se validaron 3 resoluciones (mobile/tablet/desktop).
- [ ] Se adjuntaron capturas antes/despues si hubo cambios visuales.

## 7) Primera iteracion recomendada (orden exacto)

1. Crear `ShellLayoutComponent`.
2. Reestructurar rutas para que `/menu` y `/usuarios` cuelguen del shell.
3. Migrar `menu-table` y `usuarios` quitando `app-nav/app-footer`.
4. Ajustar CSS global a `.app-shell/.app-content`.
5. Ejecutar build + smoke test manual.
6. Si pasa, continuar con el siguiente lote de pantallas.
