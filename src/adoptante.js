export const API_BASE_URL = 'http://localhost:8080/api'
export const ADOPTANTE_STORAGE_KEY = 'huellitas.adoptanteId'
export const CONNECTION_ERROR = 'No pudimos conectarnos con el servidor. Inténtalo de nuevo en unos minutos.'
export const UNEXPECTED_ERROR = 'No pudimos completar tu registro. Inténtalo de nuevo.'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateAdoptante(values) {
  const errors = {}
  const value = (field) => typeof values[field] === 'string' ? values[field].trim() : ''

  if (value('nombre').length < 2) errors.nombre = 'required'
  if (!EMAIL_PATTERN.test(value('email'))) errors.email = 'invalid'
  const phoneDigits = value('telefono').replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15) errors.telefono = 'invalid'
  if (!value('ciudad')) errors.ciudad = 'required'
  if (!value('direccion')) errors.direccion = 'required'

  return errors
}

export function buildAdoptantePayload(values) {
  return {
    nombre: values.nombre.trim(),
    email: values.email.trim(),
    telefono: values.telefono.trim(),
    ciudad: values.ciudad.trim(),
    direccion: values.direccion.trim(),
  }
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export async function registerAdoptante(payload, {
  fetchFn = (...args) => globalThis.fetch(...args),
  baseUrl = API_BASE_URL,
} = {}) {
  let response
  try {
    response = await fetchFn(`${baseUrl}/adoptantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return { ok: false, message: CONNECTION_ERROR }
  }

  const body = await readJson(response)
  if (!response.ok) {
    return { ok: false, message: body.apierror?.message ?? UNEXPECTED_ERROR }
  }
  return { ok: true, adoptante: body }
}

export function storeAdoptanteId(id, storage) {
  if (id === undefined || id === null) return
  storage.setItem(ADOPTANTE_STORAGE_KEY, String(id))
}
