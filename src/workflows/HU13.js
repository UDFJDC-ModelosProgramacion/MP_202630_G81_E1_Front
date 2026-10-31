import { apiRequest, withData } from '../api/client.js'

export function validateVacuna(values) {
  const errors = {}
  const nombre = typeof values.nombre === 'string' ? values.nombre.trim() : ''
  if (nombre.length < 2) errors.nombre = 'Ingresa el nombre de la vacuna.'
  return errors
}

export function buildVacunaPayload(values) {
  return {
    nombre: values.nombre.trim(),
    descripcion: (values.descripcion ?? '').trim(),
  }
}

export async function createVacuna(values, options) {
  const request = { ...options, method: 'POST', body: buildVacunaPayload(values) }
  return withData(await apiRequest('/vacunas', request), 'vacuna')
}

export async function updateVacuna(id, values, options) {
  const request = { ...options, method: 'PUT', body: { id: Number(id), ...buildVacunaPayload(values) } }
  return withData(await apiRequest(`/vacunas/${id}`, request), 'vacuna')
}

export async function deleteVacuna(id, options) {
  const result = await apiRequest(`/vacunas/${id}`, { ...options, method: 'DELETE' })
  return result.ok ? { ok: true } : result
}
