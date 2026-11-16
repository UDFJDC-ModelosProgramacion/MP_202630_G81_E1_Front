import { apiRequest, withData } from '../api/client.js'

export async function getNotifications(adoptanteId, options) {
  const result = withData(await apiRequest(`/notificaciones/adoptante/${adoptanteId}`, options), 'notificaciones')
  if (!result.ok) return result
  const notificaciones = [...result.notificaciones].sort((first, second) => (second.fecha ?? '').localeCompare(first.fecha ?? ''))
  return { ok: true, notificaciones }
}
