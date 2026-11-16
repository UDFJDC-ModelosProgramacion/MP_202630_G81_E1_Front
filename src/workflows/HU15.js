import { apiRequest, withData } from '../api/client.js'

export async function getVaccinationHistory(mascotaId, options) {
  const result = withData(await apiRequest('/registros-vacunacion', options), 'registros')
  if (!result.ok) return result
  const registros = result.registros
    .filter((registro) => registro.mascota?.id === Number(mascotaId))
    .sort((first, second) => (second.fechaAplicacion ?? '').localeCompare(first.fechaAplicacion ?? ''))
  return { ok: true, registros }
}
