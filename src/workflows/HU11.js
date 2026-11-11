import { apiRequest, withData } from '../api/client.js'

export async function listAdoptantes(options) {
  const result = withData(await apiRequest('/adoptantes', options), 'adoptantes')
  if (!result.ok) return result
  const adoptantes = [...result.adoptantes].sort((first, second) => first.nombre.localeCompare(second.nombre, 'es'))
  return { ok: true, adoptantes }
}

export async function getAdoptante(id, options) {
  return withData(await apiRequest(`/adoptantes/${id}`, options), 'adoptante')
}
