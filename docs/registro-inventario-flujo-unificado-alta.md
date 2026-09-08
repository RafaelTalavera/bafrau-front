# Registro de inventario: flujo unificado de alta

## Problema

La pantalla exponia dos acciones consecutivas, `Nuevo registro` y `Agregar requisito`, aunque la informacion operativa que completa el usuario corresponde al requisito. Esta separacion tecnica generaba dudas sobre cual boton usar.

## Cambio aplicado

La pantalla ahora presenta una unica accion principal: `Agregar requisito`.

- Si la organizacion no tiene registros, la accion crea en memoria el registro necesario y agrega el primer formulario de requisito.
- Si existe un registro nuevo sin guardar, agrega el requisito a ese borrador.
- Si existen registros guardados, agrega el requisito al registro mas reciente.
- Al guardar el primer requisito de una organizacion, el front crea el registro y el requisito en una sola solicitud.
- El formulario nuevo siempre se muestra sin filtros activos para que no quede oculto por el filtro de abiertos o cerrados.

## Compatibilidad

Las organizaciones nuevas pueden iniciar su carga desde `Agregar requisito` sin una preparacion previa. Los registros y requisitos existentes mantienen sus opciones de edicion, guardado individual, baja logica y restauracion.

La entidad `Control` continua existiendo en el modelo y en la comunicacion con el backend. El cambio elimina su administracion explicita de la interfaz, pero conserva la estructura requerida por la API.
