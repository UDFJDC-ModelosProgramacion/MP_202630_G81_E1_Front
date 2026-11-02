const DEFAULT_API_URL = 'http://localhost:8999/api';

function getApiUrl() {
  const configuredUrl = import.meta.env?.VITE_API_URL;
  return (configuredUrl || DEFAULT_API_URL).replace(/\/$/, '');
}

async function request(path) {
  const response = await fetch(`${getApiUrl()}${path}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('El evento médico solicitado no fue encontrado.');
    }

    throw new Error(`Error al consultar la información. Código: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function getPets() {
  const result = await request('/mascotas');

  if (Array.isArray(result)) {
    return result;
  }

  return result?.content || result?.data || [];
}

export async function getMedicalEvents() {
  const result = await request('/eventos-medicos');

  if (Array.isArray(result)) {
    return result;
  }

  return result?.content || result?.data || [];
}

export function getPetId(event) {
  return event?.mascota?.id ?? event?.mascotaId ?? '';
}

export function filterMedicalEvents(events, petId, diagnosis = '') {
  const normalizedDiagnosis = diagnosis.trim().toLowerCase();

  return events.filter((event) => {
    const belongsToPet = String(getPetId(event)) === String(petId);

    const matchesDiagnosis = String(event.diagnostico || '')
      .toLowerCase()
      .includes(normalizedDiagnosis);

    return belongsToPet && matchesDiagnosis;
  });
}

export async function getMedicalEventById(id) {
  if (!String(id || '').trim()) {
    throw new Error('Debe ingresar el ID del evento médico.');
  }

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw new Error('El ID del evento médico no es válido.');
  }

  return request(`/eventos-medicos/${encodeURIComponent(id)}`);
}