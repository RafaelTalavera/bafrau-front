# Semaforo de requisitos: navegacion a edicion

## Alcance

Este ajuste vincula `registro-semaforo` con `registro-inventario`.

## Comportamiento nuevo

- Un doble click sobre una fila del semaforo navega a `registro-inventario`.
- La navegacion envia `orgId`, `controlId` e `itemId` por query string.
- `registro-inventario` abre automaticamente la organizacion correspondiente.
- La pantalla busca el requisito indicado, hace scroll hasta ese bloque y lo resalta visualmente.
- Si el requisito ya no esta disponible para edicion, la pantalla muestra un aviso y mantiene la vista cargada.

## Impacto tecnico

- `semaforo-requisitos` ahora depende de `Router` para la navegacion.
- `inventario-registro` ahora lee `ActivatedRoute` al iniciar.
- El modelo `ItemControlDTO` del front acepta `organizacionId` para evitar inferencias por razon social.

## Archivos tocados

- `src/app/legal/semaforo-requisitos/semaforo-requisitos.component.ts`
- `src/app/legal/semaforo-requisitos/semaforo-requisitos.component.html`
- `src/app/legal/inventario-registro/inventario-registro.component.ts`
- `src/app/legal/inventario-registro/inventario-registro.component.html`
- `src/app/legal/inventario-registro/inventario-registro.component.css`
- `src/app/legal/models/control.model.ts`
