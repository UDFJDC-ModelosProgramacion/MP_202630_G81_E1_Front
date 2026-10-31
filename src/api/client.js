export const DEFAULT_API_URL = 'http://localhost:8080/api'
export const CONNECTION_ERROR = 'No pudimos conectarnos con el servidor. Inténtalo de nuevo en unos minutos.'
export const UNEXPECTED_ERROR = 'No pudimos completar la operación. Inténtalo de nuevo.'

export function getApiUrl(env = import.meta.env) {
  const configured = typeof env.VITE_API_URL === 'string' ? env.VITE_API_URL.trim() : ''
  return (configured || DEFAULT_API_URL).replace(/\/+$/, '')
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export async function apiRequest(path, {
  method = 'GET',
  body,
  fetchFn = (...args) => globalThis.fetch(...args),
  apiUrl = getApiUrl(),
} = {}) {
  const options = { method }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetchFn(`${apiUrl}${path}`, options)
  } catch {
    return { ok: false, message: CONNECTION_ERROR }
  }

  const data = await readJson(response)
  if (!response.ok) return { ok: false, message: data.apierror?.message ?? UNEXPECTED_ERROR }
  return { ok: true, data }
}

export function withData(result, key) {
  return result.ok ? { ok: true, [key]: result.data } : result
}

export function toDateOnly(value) {
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char])
}
