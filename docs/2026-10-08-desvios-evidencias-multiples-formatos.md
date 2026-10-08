# Evidencias de desvíos: múltiples formatos y validación

## Alcance

El alta y el detalle de desvíos aceptan además de imágenes otros formatos de
documento (PDF, DOCX, XLSX, XLS y CSV), con validación de tipo y tamaño del
lado del cliente, lista de archivos pendientes y visualización de las
evidencias ya guardadas.

## Implementación

Nuevo utilitario compartido `src/app/desvios/utils/evidencia-file.ts`:

- `EVIDENCIA_ACCEPT`: cadena `accept` para los inputs de archivo.
- `validateEvidenceFile(file)`: devuelve un mensaje de error o `undefined`.
  Imágenes (JPG, PNG, WebP) hasta 10 MB; documentos (PDF, DOCX, XLSX, XLS,
  CSV) hasta 25 MB. Se valida tipo MIME y extensión en conjunto.
- `isImageEvidence(type)`: distingue imágenes de documentos para el ícono.
- `fileSize(bytes)`: formatea el tamaño en KB o MB.

### Formulario de alta (`DesvioFormComponent`)

- La sección pasó de "Evidencias fotográficas" a "Evidencias": un único input
  múltiple con el `accept` completo (ya no hay botones de cámara/galería ni
  vistas previas con `FileReader`).
- Los archivos se acumulan en `files` y se muestran en una lista
  `pending-files` con ícono según tipo y botón para quitar cada uno.
- Los archivos rechazados por validación se informan en `error` sin bloquear
  los válidos.
- Si la creación del desvío tiene éxito pero alguna subida falla, se navega al
  detalle con `?evidenciaError=` indicando archivo por archivo qué no se
  guardó (`forkJoin` con `catchError` por archivo).
- El mensaje de formulario inválido ahora detalla que faltan las descripciones
  de acciones.

### Detalle (`DesvioDetailComponent`)

- La galería de imágenes se reemplazó por una lista `evidence-list` de
  evidencias con ícono (imagen o archivo), nombre original y tamaño, y enlace
  a la evidencia con `rel="noopener"`.
- Cada seguimiento muestra sus propias evidencias debajo del comentario.
- El input de carga del seguimiento usa el mismo `accept` y la misma lista de
  pendientes que el alta; las imágenes dejan de previsualizarse.

## Estilos

`evidencias.component.css` (nuevo) se agrega a `styleUrls` de ambos
componentes: estilos de `pending-files`, `evidence-list` e `evidence-item`.

## Contrato requerido

El backend debe aceptar adjuntos de los tipos listados en `EVIDENCIA_ACCEPT`,
respetar los límites de 10 MB (imágenes) y 25 MB (documentos) y devolver
`tipoMime`, `nombreOriginal` y `tamano` en cada evidencia.
