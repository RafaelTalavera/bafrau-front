# Desvíos: manejo de errores durante el alta

## Alcance

Este cambio adapta el formulario de creación de desvíos al contrato de errores
de `POST /api/desvios`. La respuesta exitosa continúa siendo `201 Created` con
un `DesvioDetalleDTO`; no se modificaron la ruta ni el payload del alta.

## Contrato de error

El frontend representa las respuestas controladas mediante `ApiErrorResponse`.
La detección del contrato se realiza en tiempo de ejecución y acepta respuestas
parciales para conservar compatibilidad con proxies o versiones anteriores del
backend.

El mensaje visible prioriza `message` cuando contiene un texto válido. Las
decisiones funcionales se toman exclusivamente mediante `code` y, si falta,
mediante el status HTTP. El texto del mensaje nunca se utiliza para clasificar
el error.

Cuando existe `correlationId`, ya sea en el cuerpo o en el header
`X-Correlation-ID`, se presenta por separado como **Referencia técnica**.

## Comportamiento del formulario

- `DESVIO_VALIDATION_ERROR` enlaza `fieldErrors` con los controles del
  `ReactiveForm`, incluidos elementos como
  `accionesInmediatas[0].descripcion`.
- Los errores del servidor se agregan con la clave `server` y conservan los
  validadores y errores existentes del cliente.
- El resumen usa `role="alert"`, recibe el foco al producirse un error y lista
  todos los mensajes de validación devueltos por la API.
- `REQUEST_BODY_INVALID`, conflictos `409`, errores `500`/`503`, respuestas
  `403` y fallos de conectividad conservan los datos ingresados y permiten un
  reintento manual.
- No se realizan reintentos automáticos del `POST`, ya que el alta no dispone
  de una clave de idempotencia.
- `status === 0` se informa como un problema de conectividad.
- Las respuestas no reconocidas usan `No se pudo crear el desvío.`.
- El estado `saving` evita envíos simultáneos y se restablece mediante
  `finalize`, tanto ante éxito como ante error.

## Autenticación y autorización

Los errores `401` se delegan al interceptor HTTP. Este invoca el flujo
idempotente `AuthService.handleAuthenticationFailure()`, que elimina la sesión y
navega al login una sola vez aunque fallen varias solicitudes concurrentes.

Los errores `403` solo informan la falta de permisos; no eliminan una sesión
válida.

## Pruebas

Las pruebas unitarias cubren:

- respuesta exitosa y navegación al detalle;
- prevención de envíos duplicados;
- errores de campos simples y elementos de `FormArray`;
- preservación de validaciones del cliente;
- mensajes seguros para red, `401`, `403`, `409`, `500` y `503`;
- prioridad del mensaje público y lectura de la referencia técnica;
- fallback para respuestas sin JSON;
- delegación de `401` al servicio central y conservación de sesión ante `403`.

Comandos de verificación:

```powershell
npx ng test --watch=false --browsers=ChromeHeadless
npx ng build --configuration development
npx ng build --configuration production
```

La configuración de Karma no carga los scripts globales de Bootstrap/AdminLTE:
las pruebas unitarias no los necesitan y algunas referencias anteriores no
existían en las dependencias instaladas.

## Archivos principales

- `src/app/models/api-error-response.ts`
- `src/app/desvios/desvio-form/desvio-form.component.ts`
- `src/app/desvios/desvio-form/desvio-form.component.html`
- `src/app/desvios/desvio-form/error-handling.component.css`
- `src/app/auth/service/authIn-terceptor.ts`
- `src/app/auth/auth.service.ts`
- `src/app/desvios/desvio-form/desvio-form.component.spec.ts`
- `src/app/auth/service/authIn-terceptor.spec.ts`
