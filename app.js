const STORAGE_KEY = 'tavo_gym_inscripciones';

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

  // Ejemplo de firma para futuro backend:
  // async create(inscripcion) {
  //   return apiClient.post('/inscripciones', inscripcion);
  // },
};

const form = document.querySelector('#registroForm');
const message = document.querySelector('#formMessage');
const inscripcionesList = document.querySelector('#inscripcionesList');

form?.addEventListener('submit', handleSubmit);
renderInscripciones();

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
    setMessage('Inscripción enviada y guardada correctamente.', 'success');
    form.reset();
    renderInscripciones();
  } catch (error) {
    console.error(error);
    setMessage('No se pudo guardar la inscripción. Intenta nuevamente.', 'error');
  }
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
