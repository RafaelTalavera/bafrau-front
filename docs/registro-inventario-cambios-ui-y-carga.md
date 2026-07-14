# Registro Inventario: numeracion, filtros y carga

## Alcance

Este ajuste afecta la pantalla `registro-inventario`.

## Cambios aplicados

- Los controles se ordenan por `fecha` ascendente.
- La numeracion de requisitos es global dentro de la organizacion y no se reinicia por cada registro.
- Los cards de resumen `requisitos activos` y `requisitos cerrados` funcionan como filtros de vista.
- El listado visible de requisitos se precalcula para evitar recomputaciones pesadas en cada ciclo de Angular.
- La carga de datos usa `forkJoin`, `timeout` y `finalize` para evitar que el spinner quede activo indefinidamente.

## Criterios funcionales

- Si una organizacion tiene 13 requisitos visibles en total, la UI debe mostrarlos del `1` al `13`.
- Al presionar `requisitos activos`, solo deben verse items con `estado === true`.
- Al presionar `requisitos cerrados`, solo deben verse items con `estado !== true`.
- Si se vuelve a presionar el mismo filtro, la vista vuelve a mostrar todos los requisitos.
- Si falla la carga de `items eliminados`, la pantalla principal igual debe destrabarse.

## Archivos tocados

- `src/app/legal/inventario-registro/inventario-registro.component.ts`
- `src/app/legal/inventario-registro/inventario-registro.component.html`
- `src/app/legal/inventario-registro/inventario-registro.component.css`
