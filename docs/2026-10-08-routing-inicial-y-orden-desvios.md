# Ruta inicial de la aplicación y orden del listado de desvíos

## Alcance

Dos ajustes menores: la raíz de la aplicación redirige al menú y el listado
de desvíos se ordena de forma estable.

## Ruta inicial

En `app-routing.module.ts` se agregó, dentro del shell, la ruta vacía con
`pathMatch: 'full'` que redirige a `menu`. Así, al abrir `/app-bafrau/` o
`/app-bafrau/index.html` no se renderiza el shell sin contenido.

## Orden del listado de desvíos

`DesviosService.listar()` cambió el `sort` por defecto de
`fechaDeteccion,desc` a `id,desc`. El orden por fecha de detección producía
paginación inestable cuando varios desvíos compartían fecha; ordenar por id
garantiza un orden total y determinístico (los más recientes primero).
