import { apiRequest, withData } from '../api/client.js'
import { isValidDate } from './storage.js'

const text = (value) => typeof value === 'string' ? value.trim() : ''

export function validateVaccination(values, today = new Date().toISOString().slice(0, 10)) {
  const errors = {}
  const applied = text(values.fechaAplicacion)
  const next = text(values.proximaFecha)

  if (!text(values.mascotaId)) errors.mascotaId = 'Selecciona una mascota.'
  if (!text(values.vacunaId)) errors.vacunaId = 'Selecciona una vacuna.'
  if (!isValidDate(applied)) {
    errors.fechaAplicacion = 'Selecciona una fecha de aplicación válida.'
  } else if (applied > today) {
    errors.fechaAplicacion = 'La fecha de aplicación no puede ser futura.'
  }
  if (next && !isValidDate(next)) {
    errors.proximaFecha = 'Selecciona una fecha válida.'
  } else if (next && isValidDate(applied) && next <= applied) {
    errors.proximaFecha = 'La próxima fecha debe ser posterior a la fecha de aplicación.'
  }
  if (!text(values.numeroLote)) errors.numeroLote = 'Ingresa el número de lote.'

  return errors
}

export function buildVaccinationPayload(values) {
  return {
    fechaAplicacion: text(values.fechaAplicacion),
    proximaFecha: text(values.proximaFecha) || null,
    numeroLote: text(values.numeroLote),
    observacion: text(values.observacion) || null,
    vacuna: { id: Number(values.vacunaId) },
    mascota: { id: Number(values.mascotaId) },
  }
}

export async function listMascotas(options) {
  const result = withData(await apiRequest('/mascotas', options), 'mascotas')
  if (!result.ok) return result
  const mascotas = [...result.mascotas].sort((first, second) => first.nombre.localeCompare(second.nombre, 'es'))
  return { ok: true, mascotas }
}

export async function createVaccination(values, options) {
  const request = { ...options, method: 'POST', body: buildVaccinationPayload(values) }
  return withData(await apiRequest('/registros-vacunacion', request), 'registro')
}
