const DEFAULT_API_URL = 'http://localhost:8999/api';

function getApiUrl() {
  const configuredUrl = import.meta.env?.VITE_API_URL;
  return (configuredUrl || DEFAULT_API_URL).replace(/\/$/, '');
}

async function request(path, options = {}) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Error HTTP ${response.status}`;

    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // La respuesta puede no contener JSON.
    }

    if (response.status === 404) {
      throw new Error('El evento médico o la mascota no fueron encontrados.');
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function validateMedicalEvent(values) {
  const errors = {};

  if (!values.mascotaId) {
    errors.mascotaId = 'Debe seleccionar una mascota.';
  }

  if (!values.fecha) {
    errors.fecha = 'La fecha es obligatoria.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.fecha)) {
    errors.fecha = 'La fecha no tiene un formato válido.';
  }

  if (!String(values.descripcion || '').trim()) {
    errors.descripcion = 'La descripción es obligatoria.';
  }

  if (!String(values.diagnostico || '').trim()) {
    errors.diagnostico = 'El diagnóstico es obligatorio.';
  }

  if (!String(values.tratamiento || '').trim()) {
    errors.tratamiento = 'El tratamiento es obligatorio.';
  }

  return errors;
}

export function validateMedicalEventUpdate(values) {
  const errors = {};

  if (!String(values.descripcion || '').trim()) {
    errors.descripcion = 'La descripción es obligatoria.';
  }

  if (!String(values.diagnostico || '').trim()) {
    errors.diagnostico = 'El diagnóstico es obligatorio.';
  }

  if (!String(values.tratamiento || '').trim()) {
    errors.tratamiento = 'El tratamiento es obligatorio.';
  }

  return errors;
}

export async function getMedicalEvents() {
  const result = await request('/eventos-medicos');

  if (Array.isArray(result)) {
    return result;
  }

  return result?.content || result?.data || [];
}

export async function getPets() {
  const result = await request('/mascotas');

  if (Array.isArray(result)) {
    return result;
  }

  return result?.content || result?.data || [];
}

export async function createMedicalEvent(values) {
  const errors = validateMedicalEvent(values);

  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors).join(' '));
  }

  const payload = {
    fecha: new Date(`${values.fecha}T00:00:00.000Z`).toISOString(),
    descripcion: values.descripcion.trim(),
    diagnostico: values.diagnostico.trim(),
    tratamiento: values.tratamiento.trim(),
    mascota: {
      id: Number(values.mascotaId),
    },
  };

  return request('/eventos-medicos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMedicalEvent(id, values, originalEvent) {
  if (!id) {
    throw new Error('El ID del evento médico es obligatorio.');
  }

  const errors = validateMedicalEventUpdate(values);

  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors).join(' '));
  }

  const payload = {
    ...originalEvent,
    descripcion: values.descripcion.trim(),
    diagnostico: values.diagnostico.trim(),
    tratamiento: values.tratamiento.trim(),
  };

  return request(`/eventos-medicos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}