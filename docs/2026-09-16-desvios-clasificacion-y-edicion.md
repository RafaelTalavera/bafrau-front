# Cambios del módulo de desvíos — 2026-09-16

## Alcance

La interfaz incorpora las clasificaciones del desvío, edición auditada de los
datos base y de los seguimientos, y una consulta de listado orientada a un
cliente seleccionado. Consume los contratos incorporados por el backend en el
mismo cambio.

## Alta y detalle

- El alta exige `indiceGravedad` y `condicionOperacion`.
- El detalle muestra ambas clasificaciones y permite modificar sólo los datos
  base habilitados por la API. Organización, inspector y metadatos de auditoría
  permanecen sin controles de edición.
- Al editar un seguimiento se conserva su autor original y se muestran el
  editor, la fecha y los valores previos en el historial devuelto por la API.
- El avance que se presenta en el listado se deriva del estado funcional para
  mantener una representación uniforme: permanece 0 %, en proceso 50 %, primera
  observación 75 % y finalizado 100 %.

## Listado por cliente

La pantalla no muestra desvíos hasta que se selecciona un cliente vigente. La
búsqueda de clientes es local sobre las organizaciones cargadas y se muestra el
contador de desvíos cuando la API responde.

Los filtros de texto, estado, año y mes se envían al endpoint paginado. Año y
mes se traducen a `desde` y `hasta`; no se cargan ni filtran lotes completos en
el navegador. Esto conserva el conteo y la paginación del servidor incluso si
un cliente supera una página grande de resultados.

## Dependencia operativa

Antes de habilitar el alta en un ambiente con datos existentes debe aplicarse
por el procedimiento autorizado la migración de clasificaciones del backend.
La edición de seguimientos requiere además las tablas de auditoría documentadas
allí. No se ejecutaron migraciones desde el frontend.

## Validación

Se ejecutó `npm run build` correctamente. El compilador informó una advertencia
preexistente de selector CSS de una dependencia, sin errores de TypeScript ni
de plantilla.
