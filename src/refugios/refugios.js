// HU30 - Shelter management: pure logic (no DOM access) so it can be unit tested.
import { DEFAULT_API_URL } from '../catalog/catalog.js'

export const SHELTER_NOT_FOUND = 'El refugio no fue encontrado.'

export const SHELTER_FIELDS = [
  { name: 'nombre', required: 'El nombre es obligatorio.' },
  { name: 'ciudad', required: 'La ciudad es obligatoria.' },
  { name: 'direccion', required: 'La dirección es obligatoria.' },
  { name: 'telefono', required: 'El teléfono es obligatorio.' },
  { name: 'correo', required: 'El correo es obligatorio.' },
  { name: 'descripcion', required: 'La descripción es obligatoria.' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const READ_HEADERS = { Accept: 'application/json' }
const WRITE_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' }

export class ShelterError extends Error {
  constructor(message, { status = null } = {}) {
    super(message)
    this.name = 'ShelterError'
    this.status = status
  }
}

export function trimValues(values) {
  return Object.fromEntries(
    SHELTER_FIELDS.map(({ name }) => [name, String(values[name] ?? '').trim()]),
  )
}

export function validateShelter(values) {
  const clean = trimValues(values)
  const errors = {}
  for (const { name, required } of SHELTER_FIELDS) {
    if (!clean[name]) errors[name] = required
  }
  if (clean.correo && !EMAIL_PATTERN.test(clean.correo)) {
    errors.correo = 'Ingresa un correo válido, por ejemplo nombre@dominio.com.'
  }
  return errors
}

export function parseShelterRoute(search = '') {
  const params = new URLSearchParams(search)
  const id = params.get('id')
  return {
    editing: params.has('id'),
    id: id !== null && /^\d+$/.test(id) ? id : null,
  }
}

export function normalizeShelter(raw) {
  const source = raw ?? {}
  return {
    id: source.id ?? null,
    ...Object.fromEntries(SHELTER_FIELDS.map(({ name }) => [name, String(source[name] ?? '')])),
  }
}

export function successMessage(editing) {
  return editing ? 'Refugio actualizado correctamente.' : 'Refugio registrado correctamente.'
}

async function readServerMessage(response) {
  try {
    const { message } = await response.json()
    return typeof message === 'string' ? message.trim() : ''
  } catch {
    return ''
  }
}

async function send(fetchFn, url, options, notFound = '') {
  let response
  try {
    response = await fetchFn(url, options)
  } catch {
    throw new ShelterError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  }

  if (response.status === 404 && notFound) {
    throw new ShelterError(notFound, { status: 404 })
  }

  if (!response.ok) {
    const serverMessage = await readServerMessage(response)
    throw new ShelterError(serverMessage || 'El servidor no pudo procesar el refugio en este momento.', {
      status: response.status,
    })
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function fetchShelter(fetchFn, id, apiUrl = DEFAULT_API_URL) {
  const body = await send(
    fetchFn,
    `${apiUrl}/refugios/${encodeURIComponent(id)}`,
    { headers: READ_HEADERS },
    SHELTER_NOT_FOUND,
  )

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ShelterError('El servidor respondió con un formato inesperado.')
  }

  return normalizeShelter(body)
}

export async function createShelter(fetchFn, values, apiUrl = DEFAULT_API_URL) {
  const body = await send(fetchFn, `${apiUrl}/refugios`, {
    method: 'POST',
    headers: WRITE_HEADERS,
    body: JSON.stringify(trimValues(values)),
  })
  return normalizeShelter(body)
}

export async function updateShelter(fetchFn, id, values, apiUrl = DEFAULT_API_URL) {
  const body = await send(
    fetchFn,
    `${apiUrl}/refugios/${encodeURIComponent(id)}`,
    { method: 'PUT', headers: WRITE_HEADERS, body: JSON.stringify(trimValues(values)) },
    SHELTER_NOT_FOUND,
  )
  return normalizeShelter(body)
}
