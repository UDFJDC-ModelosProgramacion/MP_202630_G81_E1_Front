// Cliente HTTP compartido por las historias que consumen el API (HU31, HU32, HU34 y HU35).
// Lógica pura (sin DOM) para poder probarla con pruebas unitarias.

export const GENERIC_FAILURE = 'El servidor no pudo procesar la solicitud en este momento.'
export const NETWORK_FAILURE = 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
export const UNEXPECTED_FORMAT = 'El servidor respondió con un formato inesperado.'

const READ_HEADERS = { Accept: 'application/json' }
const WRITE_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export class ApiError extends Error {
  constructor(message, { status = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// El back (ApiError) responde { apierror: { message } } cuando rechaza una petición.
export async function readServerMessage(response) {
  try {
    const { apierror } = await response.json()
    return typeof apierror?.message === 'string' ? apierror.message.trim() : ''
  } catch {
    return ''
  }
}

export async function requestJson(
  fetchFn,
  url,
  { method = 'GET', body, notFound = '', failure = GENERIC_FAILURE } = {},
) {
  const options = body === undefined
    ? { method, headers: READ_HEADERS }
    : { method, headers: WRITE_HEADERS, body: JSON.stringify(body) }

  let response
  try {
    response = await fetchFn(url, options)
  } catch {
    throw new ApiError(NETWORK_FAILURE)
  }

  if (response.status === 404 && notFound) {
    throw new ApiError(notFound, { status: 404 })
  }

  if (!response.ok) {
    const serverMessage = await readServerMessage(response)
    throw new ApiError(serverMessage || failure, { status: response.status })
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

export const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

export function expectObject(body) {
  if (!isObject(body)) throw new ApiError(UNEXPECTED_FORMAT)
  return body
}

export function expectList(body) {
  if (!Array.isArray(body)) throw new ApiError(UNEXPECTED_FORMAT)
  return body
}

export const isId = (value) => /^\d+$/.test(String(value))
export const isEmail = (value) => EMAIL_PATTERN.test(value)
export const isDate = (value) => DATE_PATTERN.test(value)
export const orNull = (value) => (value === '' ? null : value)

export function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function validateId(value, message) {
  return isId(String(value).trim()) ? '' : message
}

export function trimValues(values, fields) {
  return Object.fromEntries(
    fields.map(({ name }) => [name, String(values[name] ?? '').trim()]),
  )
}

export function requiredErrors(clean, fields) {
  const errors = {}
  for (const { name, required } of fields) {
    if (required && !clean[name]) errors[name] = required
  }
  return errors
}

export function parseIdParam(search = '') {
  const params = new URLSearchParams(search)
  const id = params.get('id')
  return { present: params.has('id'), id: id !== null && isId(id) ? id : null }
}
