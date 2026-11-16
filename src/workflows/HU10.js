import { apiRequest, withData } from '../api/client.js'
import { buildAdoptantePayload, validateAdoptante } from './HU09.js'

export const validateProfile = validateAdoptante

export async function loadProfile(id, options) {
  return withData(await apiRequest(`/adoptantes/${id}`, options), 'adoptante')
}

export async function saveProfile(id, values, options) {
  const request = { ...options, method: 'PUT', body: { id: Number(id), ...buildAdoptantePayload(values) } }
  return withData(await apiRequest(`/adoptantes/${id}`, request), 'adoptante')
}
