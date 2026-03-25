const STORAGE_KEY = 'tavo_gym_inscripciones';
const ADMIN_EMAIL = 'gustavosaraviaunan@gmail.com';

/**
 * Configuración para EmailJS.
 * Reemplaza estos valores con tus IDs reales de EmailJS para habilitar envío.
 */
const EMAIL_CONFIG = {
  publicKey: 'TU_PUBLIC_KEY_EMAILJS',
  serviceId: 'TU_SERVICE_ID',
  adminTemplateId: 'TEMPLATE_ADMIN_INSCRIPCION',
  userTemplateId: 'TEMPLATE_AGRADECIMIENTO_USUARIO',
};

const form = document.querySelector('#registroForm');
const message = document.querySelector('#formMessage');
const inscripcionesList = document.querySelector('#inscripcionesList');

initEmailClient();
form?.addEventListener('submit', handleSubmit);
renderInscripciones();

/**
 * Capa de repositorio para manejar persistencia.
 * Actualmente usa localStorage.
 * Está lista para reemplazarse por API cuando exista backend.
 */
const inscripcionesRepository = {
  async list() {
    return getInscripcionesFromLocalStorage();
  },

  async create(inscripcion) {
    const current = getInscripcionesFromLocalStorage();
    current.unshift(inscripcion);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return inscripcion;
  },
};

async function handleSubmit(event) {
  event.preventDefault();
  clearMessage();

  const formData = new FormData(form);
  const payload = {
    id: crypto.randomUUID(),
    nombre: formData.get('nombre')?.toString().trim() || '',
    email: formData.get('email')?.toString().trim() || '',
    objetivo: formData.get('objetivo')?.toString() || '',
    experiencia: formData.get('experiencia')?.toString() || '',
    mensaje: formData.get('mensaje')?.toString().trim() || '',
    createdAt: new Date().toISOString(),
  };

  const validationError = validateInscripcion(payload);
  if (validationError) {
    setMessage(validationError, 'error');
    return;
  }

  try {
    await inscripcionesRepository.create(payload);
    await sendNotificationEmails(payload);
    setMessage('Inscripción enviada. Revisa tu correo para ver el agradecimiento.', 'success');
    form.reset();
    renderInscripciones();
  } catch (error) {
    console.error(error);
    setMessage('Se guardó la inscripción, pero hubo un problema al enviar correos.', 'error');
  }
}

async function sendNotificationEmails(inscripcion) {
  if (!isEmailReady()) {
    return;
  }

  const baseParams = {
    nombre: inscripcion.nombre,
    email: inscripcion.email,
    objetivo: inscripcion.objetivo,
    experiencia: inscripcion.experiencia,
    mensaje: inscripcion.mensaje || 'Sin mensaje adicional',
    fecha_registro: formatDate(inscripcion.createdAt),
  };

  const adminEmailPromise = emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.adminTemplateId, {
    ...baseParams,
    to_email: ADMIN_EMAIL,
    asunto: 'Nueva inscripción en TAVO GYM',
  });

  const thankYouEmailPromise = emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.userTemplateId, {
    ...baseParams,
    to_email: inscripcion.email,
    asunto: 'Gracias por inscribirte en TAVO GYM',
  });

  await Promise.all([adminEmailPromise, thankYouEmailPromise]);
}

function initEmailClient() {
  if (!isEmailReady()) {
    return;
  }

  emailjs.init({
    publicKey: EMAIL_CONFIG.publicKey,
  });
}

function isEmailReady() {
  const hasSdk = typeof window.emailjs !== 'undefined';
  const hasCredentials = Object.values(EMAIL_CONFIG).every((value) => !value.startsWith('TU_'));
  return hasSdk && hasCredentials;
}

async function renderInscripciones() {
  const items = await inscripcionesRepository.list();

  if (!items.length) {
    inscripcionesList.innerHTML = '<li>No hay inscripciones todavía.</li>';
    return;
  }

  inscripcionesList.innerHTML = items
    .slice(0, 8)
    .map(
      (item) => `
        <li>
          <strong>${escapeHTML(item.nombre)}</strong><br />
          <span>${escapeHTML(item.objetivo)} · ${escapeHTML(item.experiencia)}</span><br />
          <small>${formatDate(item.createdAt)}</small>
        </li>
      `
    )
    .join('');
}

function validateInscripcion(data) {
  if (!data.nombre || data.nombre.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres.';
  }

  if (!isValidEmail(data.email)) {
    return 'Ingresa un correo electrónico válido.';
  }

  if (!data.objetivo || !data.experiencia) {
    return 'Selecciona objetivo y nivel para continuar.';
  }

  return null;
}

function getInscripcionesFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);

  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function setMessage(text, type) {
  message.textContent = text;
  message.classList.remove('success', 'error');
  message.classList.add(type);
}

function clearMessage() {
  message.textContent = '';
  message.classList.remove('success', 'error');
}

function escapeHTML(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
