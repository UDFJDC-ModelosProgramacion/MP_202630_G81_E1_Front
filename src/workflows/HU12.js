import { apiRequest, withData } from '../api/client.js'

export async function listVacunas(options) {
  const result = withData(await apiRequest('/vacunas', options), 'vacunas')
  if (!result.ok) return result
  const vacunas = [...result.vacunas].sort((first, second) => first.nombre.localeCompare(second.nombre, 'es'))
  return { ok: true, vacunas }
}

export async function getVacuna(id, options) {
  return withData(await apiRequest(`/vacunas/${id}`, options), 'vacuna')
}
