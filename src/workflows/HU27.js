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
      // La respuesta puede no tener contenido JSON.
    }

    if (response.status === 404) {
      throw new Error('La notificación solicitada no fue encontrada.');
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function validateNotification(values) {
  const errors = {};

  if (!String(values.tipo || '').trim()) {
    errors.tipo = 'El tipo de notificación es obligatorio.';
  }

  if (!String(values.mensaje || '').trim()) {
    errors.mensaje = 'El mensaje es obligatorio.';
  }

  if (!values.fecha) {
    errors.fecha = 'La fecha es obligatoria.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.fecha)) {
    errors.fecha = 'La fecha no tiene un formato válido.';
  }

  if (!['EMAIL', 'SMS', 'PUSH'].includes(values.canal)) {
    errors.canal = 'Debe seleccionar un canal válido.';
  }

  return errors;
}

export function filterNotifications(notifications, filters = {}) {
  return notifications.filter((notification) => {
    const channelMatches =
      !filters.canal ||
      notification.canal === filters.canal;

    const petId =
      notification.mascota?.id ??
      notification.mascota?.mascotaId;

    const adopterId =
      notification.adoptante?.id ??
      notification.adoptante?.adoptanteId;

    const petMatches =
      !filters.mascotaId ||
      String(petId) === String(filters.mascotaId);

    const adopterMatches =
      !filters.adoptanteId ||
      String(adopterId) === String(filters.adoptanteId);

    return channelMatches && petMatches && adopterMatches;
  });
}

export async function getNotifications() {
  const result = await request('/notificaciones');

  if (Array.isArray(result)) {
    return result;
  }

  return result?.content || result?.data || [];
}

export async function updateNotification(id, values, originalNotification) {
  const errors = validateNotification(values);

  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors).join(' '));
  }

  if (!id) {
    throw new Error('El ID de la notificación es obligatorio.');
  }

  const payload = {
    ...originalNotification,
    tipo: values.tipo.trim(),
    mensaje: values.mensaje.trim(),
    fecha: new Date(`${values.fecha}T00:00:00.000Z`).toISOString(),
    canal: values.canal,
  };

  return request(`/notificaciones/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteNotification(id) {
  if (!id) {
    throw new Error('El ID de la notificación es obligatorio.');
  }

  return request(`/notificaciones/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function getPets() {
  const result = await request('/mascotas');

  if (Array.isArray(result)) {
    return result;
  }

  return result?.content || result?.data || [];
}

export async function getAdopters() {
  const result = await request('/adoptantes');

  if (Array.isArray(result)) {
    return result;
  }

  return result?.content || result?.data || [];
}