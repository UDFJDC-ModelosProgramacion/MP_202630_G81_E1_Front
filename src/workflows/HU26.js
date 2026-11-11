export const DEFAULT_API_URL = 'http://localhost:8999/api'

export class NotificationError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'NotificationError'
    this.status = options.status ?? null
  }
}

export function getApiUrl(env = import.meta.env) {
  const configured = typeof env?.VITE_API_URL === 'string'
    ? env.VITE_API_URL.trim()
    : ''
  return (configured || DEFAULT_API_URL).replace(/\/+$/, '')
}

function cleanText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function normalizePet(raw = {}) {
  const name = cleanText(raw.nombre, 'Mascota sin nombre')
  const species = cleanText(raw.especie)
  return {
    id: raw.id ?? null,
    name,
    species,
    label: species ? `${name} · ${species} (ID ${raw.id ?? '?'})` : `${name} (ID ${raw.id ?? '?'})`,
  }
}

export function normalizeAdopter(raw = {}) {
  const fullName = [raw.nombre, raw.apellido, raw.apellidos]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
  const name = cleanText(raw.nombreCompleto, cleanText(fullName, cleanText(raw.nombre, 'Adoptante sin nombre')))
  return {
    id: raw.id ?? null,
    name,
    label: `${name} (ID ${raw.id ?? '?'})`,
  }
}

export function validateNotification(values) {
  const errors = {}
  if (!cleanText(values.tipo)) errors.tipo = 'Escribe el tipo de notificación.'
  if (!cleanText(values.mensaje)) errors.mensaje = 'Escribe el mensaje de la notificación.'
  if (!isValidDate(values.fecha)) errors.fecha = 'Selecciona una fecha válida.'
  if (!['EMAIL', 'SMS', 'PUSH'].includes(values.canal)) {
    errors.canal = 'Selecciona un canal válido.'
  }
  if (!Number.isInteger(Number(values.mascotaId)) || Number(values.mascotaId) <= 0) {
    errors.mascotaId = 'Selecciona una mascota existente.'
  }
  if (values.adoptanteId !== '' &&
      (!Number.isInteger(Number(values.adoptanteId)) || Number(values.adoptanteId) <= 0)) {
    errors.adoptanteId = 'Selecciona un adoptante válido.'
  }
  return errors
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

async function requestJson(fetchFn, url, options, fallbackMessage) {
  let response
  try {
    response = await fetchFn(url, options)
  } catch {
    throw new NotificationError('No pudimos conectar con el servidor. Verifica que el backend esté ejecutándose.')
  }

  if (!response.ok) {
    let message = fallbackMessage
    try {
      const body = await response.json()
      message = body.message || body.mensaje || body.error || message
    } catch {
      // La respuesta de error puede no contener JSON.
    }
    throw new NotificationError(message, { status: response.status })
  }

  if (response.status === 204) return null
  try {
    return await response.json()
  } catch {
    throw new NotificationError('El servidor respondió con información que no se puede leer.')
  }
}

export async function fetchPets(fetchFn = fetch, apiUrl = DEFAULT_API_URL) {
  const data = await requestJson(
    fetchFn,
    `${apiUrl}/mascotas`,
    { headers: { Accept: 'application/json' } },
    'No fue posible cargar las mascotas.',
  )
  if (!Array.isArray(data)) throw new NotificationError('La respuesta de mascotas tiene un formato inesperado.')
  return data.map(normalizePet).filter((pet) => pet.id !== null)
}

export async function fetchAdopters(fetchFn = fetch, apiUrl = DEFAULT_API_URL) {
  const data = await requestJson(
    fetchFn,
    `${apiUrl}/adoptantes`,
    { headers: { Accept: 'application/json' } },
    'No fue posible cargar los adoptantes.',
  )
  if (!Array.isArray(data)) throw new NotificationError('La respuesta de adoptantes tiene un formato inesperado.')
  return data.map(normalizeAdopter).filter((adopter) => adopter.id !== null)
}

export function buildNotificationPayload(values) {
  const errors = validateNotification(values)
  if (Object.keys(errors).length) {
    throw new NotificationError('Revisa los campos del formulario antes de continuar.')
  }
  return {
    tipo: values.tipo.trim(),
    mensaje: values.mensaje.trim(),
    fecha: new Date(`${values.fecha}T00:00:00.000Z`).toISOString(),
    canal: values.canal,
    mascota: { id: Number(values.mascotaId) },
    adoptante: values.adoptanteId === '' ? null : { id: Number(values.adoptanteId) },
  }
}

export async function createNotification(fetchFn = fetch, values, apiUrl = DEFAULT_API_URL) {
  const payload = buildNotificationPayload(values)
  return requestJson(
    fetchFn,
    `${apiUrl}/notificaciones`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    'No fue posible registrar la notificación.',
  )
}
