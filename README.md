# gimnasio

Landing page de gimnasio con formulario de inscripción.

## Qué hace ahora

- Guarda inscripciones en `localStorage`.
- Envía dos correos al enviar la inscripción (si configuras EmailJS):
  - Notificación a `gustavosaraviaunan@gmail.com`.
  - Correo de agradecimiento al email del usuario.
- Incluye placeholders para imágenes con tamaños definidos:
  - Hero: `1200 x 700 px`.
  - Galería: `900 x 600 px`.

## Configurar envío de correos (EmailJS)

1. Crea cuenta en [EmailJS](https://www.emailjs.com/).
2. Crea un servicio de correo.
3. Crea dos templates:
   - `TEMPLATE_ADMIN_INSCRIPCION`
   - `TEMPLATE_AGRADECIMIENTO_USUARIO`
4. En `app.js`, reemplaza los valores de `EMAIL_CONFIG`:
   - `publicKey`
   - `serviceId`
   - `adminTemplateId`
   - `userTemplateId`

Mientras no se configuren esos valores, la inscripción se sigue guardando localmente, pero no se enviarán correos.
