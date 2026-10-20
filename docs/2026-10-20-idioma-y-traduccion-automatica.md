# Idioma y traducción automática de la aplicación

## Problema

En algunos equipos, el índice de gravedad `4 – Grave` se mostraba como
`4 – Tumba` en el alta de desvíos y en otras vistas que reutilizan esa
etiqueta.

La aplicación declaraba `lang="en"` aunque su contenido está escrito en
español. Cuando el navegador tenía habilitada la traducción automática de
inglés a español, interpretaba `Grave` como el sustantivo inglés y lo traducía
como `Tumba`. El valor funcional y la etiqueta definidos por la aplicación no
estaban alterados.

## Solución

El documento raíz ahora:

- declara el idioma correcto mediante `lang="es-AR"`;
- utiliza `translate="no"` para indicar que la interfaz no debe traducirse;
- incluye `<meta name="google" content="notranslate">` para impedir la
  traducción automática de Google Translate.

La protección es global porque los textos de la interfaz son etiquetas
funcionales en español y `Grave` también aparece en listados, detalle y
gráficos.

## Impacto

No cambia valores enviados al backend, modelos, validaciones ni opciones del
formulario. Solo corrige los metadatos de idioma y evita modificaciones de
texto realizadas por el navegador.

## Validación

1. Generar el build de producción.
2. Confirmar que el HTML generado contiene `lang="es-AR"`, `translate="no"` y
   la directiva `notranslate`.
3. Abrir `/app-bafrau/desvios/nuevo` en un navegador con traducción automática
   habilitada y comprobar que la opción continúa mostrando `4 – Grave`.
