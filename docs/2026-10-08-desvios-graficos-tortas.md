# Gráficos de tortas en el listado de desvíos

## Alcance

El listado de desvíos (`/desvios`) muestra dos gráficos de torta —resumen de
la información devuelta por la GET— entre la selección del cliente y la tabla.
Al presionar una feta, la tabla muestra únicamente los desvíos de esa feta.

## Implementación

### Gráficos

- **Índice de gravedad**: Muy leve → Crítico más "Sin clasificar", contando
  la cantidad de desvíos de cada categoría.
- **Avance**: distribución por estado (En avance, En proceso, Permanece,
  Finalizado), con el porcentaje de avance de cada estado en la leyenda.

Se usan dos chart.js `doughnut` (registrados a mano: `DoughnutController`,
`ArcElement`, `Legend`, `Tooltip` para no arrastrar el bundle completo).

### Ubicación y tamaño

La sección `charts-summary` está entre el bloque de cliente seleccionado /
filtros y la tabla. Cada gráfico ocupa media pantalla (`col-md-6`) con un
canvas de 220px de alto (200px en mobile), para no dominar la vista.

### Datos

`cargar()` ahora pagina en cliente: la GET se hace con `page: 0` y
`size: 1000` para obtener el conjunto completo coincidente, se guarda en
`todosLosItems` y tanto los gráficos como la paginación de la tabla (20 por
página) se calculan sobre ese conjunto.

### Interacción con la tabla

- `filtroGraficoGravedad` y `filtroGraficoEstado` filtran el getter `items`
  (y `actualizarPaginacion()` recalcula las páginas con la misma lógica,
  centralizada en `filtrarPorGraficos()`).
- Clic en una feta: alterna la selección, resalta la feta (`offset` de 10px)
  y la tabla muestra solo ese segmento; se puede combinar con el otro gráfico.
- Clic en la misma feta la deselecciona.
- Aparece el cartel "La tabla muestra el segmento seleccionado" con botón
  **Quitar selección**.
- Se limpian los filtros al cambiar de cliente, al limpiar filtros y al quitar
  el cliente (los gráficos también se destruyen).

La reconstrucción del gráfico tras un clic se difiere con `setTimeout` para no
destruir el gráfico durante su propio manejo de eventos; tras cada carga
también se difiere para que los `@ViewChild` estén disponibles.

## Archivos

- `src/app/desvios/desvios-list/desvios-list.component.ts`
- `src/app/desvios/desvios-list/desvios-list.component.html`
- `src/app/desvios/desvios-list/desvios-list.component.css`
