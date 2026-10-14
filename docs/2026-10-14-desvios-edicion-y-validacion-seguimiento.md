# Desvíos: edición y validación de seguimientos

## Alcance

Este ajuste afecta el detalle de un desvío y el alta de sus seguimientos.

## Cambios aplicados

- La sección de consulta de descripción y acciones se oculta mientras está abierto
  el formulario de edición; ambos estados son excluyentes.
- El encabezado del formulario de edición conserva el contexto y explica que se
  pueden modificar el hallazgo y las medidas definidas.
- Al intentar guardar un seguimiento incompleto, se marcan los campos inválidos
  y se muestra un mensaje concreto: se prioriza la ausencia de comentario y, en
  los demás casos, se solicitan los campos obligatorios.
- Los campos inválidos muestran un borde y resalte rojo. Los errores de guardado
  se presentan como una alerta fija y visible, sin desplazar el contenido.

## Archivos modificados

- `src/app/desvios/desvio-detail/desvio-detail.component.html`
- `src/app/desvios/desvio-detail/desvio-detail.component.ts`
