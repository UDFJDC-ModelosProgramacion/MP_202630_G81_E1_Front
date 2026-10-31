import { apiRequest, toDateOnly, withData } from '../api/client.js'
import { buildVaccinationPayload } from './HU14.js'

export function toEditValues(registro) {
  return {
    mascotaId: String(registro.mascota.id),
    vacunaId: String(registro.vacuna.id),
    fechaAplicacion: toDateOnly(registro.fechaAplicacion),
    proximaFecha: toDateOnly(registro.proximaFecha),
    numeroLote: registro.numeroLote ?? '',
    observacion: registro.observacion ?? '',
  }
}

export async function updateVaccination(id, values, options) {
  const request = { ...options, method: 'PUT', body: { id: Number(id), ...buildVaccinationPayload(values) } }
  return withData(await apiRequest(`/registros-vacunacion/${id}`, request), 'registro')
}

export async function deleteVaccination(id, options) {
  const result = await apiRequest(`/registros-vacunacion/${id}`, { ...options, method: 'DELETE' })
  return result.ok ? { ok: true } : result
}
