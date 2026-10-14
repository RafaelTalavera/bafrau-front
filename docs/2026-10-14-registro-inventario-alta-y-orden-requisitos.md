# Registro de inventario: alta y orden de requisitos

## Alcance

Este ajuste afecta la lista de requisitos en `registro-inventario`.

## Cambios aplicados

- Los requisitos creados sin guardar se insertan al inicio del control, se
  muestran antes que los persistidos y se marca el card recién agregado para
  ubicarlo en pantalla.
- Los registros que contienen requisitos nuevos se adelantan en la vista. Los
  demás conservan el orden existente por vencimiento.
- La numeración `Requisito N` se recalcula después de ordenar, por lo que refleja
  siempre el orden que ve la persona usuaria.
- Cada borrador recibe una clave transitoria negativa para que Angular pueda
  reordenar varios requisitos nuevos sin reutilizar el mismo `id: null`.
- Al agregar un requisito, el filtro pasa a activos, el borrador se crea activo
  y la página se desplaza al nuevo card si este no es visible.
- Se ajustó la alineación y el espaciado del selector de plazo dentro de la
  configuración de vencimiento.

## Archivos modificados

- `src/app/legal/inventario-registro/inventario-registro.component.ts`
- `src/app/legal/inventario-registro/inventario-registro.component.html`
- `src/app/legal/inventario-registro/inventario-registro.component.css`
