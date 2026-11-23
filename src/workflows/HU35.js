// HU35 - Programar y consultar seguimientos veterinarios: lógica pura (sin DOM).
import { DEFAULT_API_URL, PET_NOT_FOUND, escapeHtml } from '../catalog/catalog.js'
import {
  ApiError, expectList, expectObject, isDate, isId, isObject, orNull, requestJson, requiredErrors,
  text, trimValues, validateId,
} from '../api-client.js'

export const FOLLOWUP_STATES = ['Programado', 'Completado']
export const COMPLETED_STATE = 'Completado'
export const FOLLOWUP_NOT_FOUND = 'El seguimiento no fue encontrado.'
export const FOLLOWUP_REFS_NOT_FOUND = 'La mascota o el veterinario indicado no existe.'
export const COMPLETED_MESSAGE = 'No se puede modificar ni eliminar un seguimiento en estado "Completado".'
export const PET_ID_ERROR = 'Ingresa el número de la mascota.'
export const NO_FOLLOWUPS_MESSAGE = 'Esta mascota no tiene seguimientos registrados.'

// Las claves son los nombres de los campos que envía el API (SeguimientoDTO).
export const FOLLOWUP_FIELDS = [
  { name: 'fechaAsignacion', label: 'Fecha de asignación', type: 'date', required: 'La fecha de asignación es obligatoria.' },
  { name: 'proximaCita', label: 'Próxima cita', type: 'date' },
  { name: 'observacion', label: 'Observación', type: 'textarea' },
  { name: 'estado', label: 'Estado', type: 'select', options: FOLLOWUP_STATES, required: 'Selecciona el estado del seguimiento.' },
  { name: 'mascotaId', label: 'Número de mascota', type: 'number', required: 'El número de mascota es obligatorio.' },
  { name: 'veterinarioId', label: 'Número de veterinario', type: 'number', required: 'El número de veterinario es obligatorio.' },
]

export function validateFollowUp(values) {
  const clean = trimValues(values, FOLLOWUP_FIELDS)
  const errors = requiredErrors(clean, FOLLOWUP_FIELDS)

  if (clean.fechaAsignacion && !isDate(clean.fechaAsignacion)) errors.fechaAsignacion = 'Ingresa una fecha de asignación válida.'
  if (clean.proximaCita && !isDate(clean.proximaCita)) errors.proximaCita = 'Ingresa una fecha de próxima cita válida.'
  if (
    clean.fechaAsignacion && clean.proximaCita
    && !errors.fechaAsignacion && !errors.proximaCita
    && clean.proximaCita < clean.fechaAsignacion
  ) {
    errors.proximaCita = 'La próxima cita no puede ser anterior a la fecha de asignación.'
  }
  if (clean.estado && !FOLLOWUP_STATES.includes(clean.estado)) errors.estado = 'El estado del seguimiento no es válido.'
  if (clean.mascotaId && !isId(clean.mascotaId)) errors.mascotaId = 'El número de mascota debe ser un número positivo.'
  if (clean.veterinarioId && !isId(clean.veterinarioId)) errors.veterinarioId = 'El número de veterinario debe ser un número positivo.'

  return errors
}

export function buildFollowUpPayload(values) {
  const clean = trimValues(values, FOLLOWUP_FIELDS)
  return {
    fechaAsignacion: clean.fechaAsignacion,
    proximaCita: orNull(clean.proximaCita),
    observacion: orNull(clean.observacion),
    estado: clean.estado,
    mascota: { id: Number(clean.mascotaId) },
    veterinario: { id: Number(clean.veterinarioId) },
  }
}

const day = (value) => text(value).slice(0, 10)

export function normalizeFollowUp(raw) {
  return {
    id: raw.id ?? null,
    fechaAsignacion: day(raw.fechaAsignacion),
    proximaCita: day(raw.proximaCita),
    observacion: text(raw.observacion),
    estado: text(raw.estado, 'Programado'),
    mascotaId: raw.mascota?.id ?? null,
    veterinarioId: raw.veterinario?.id ?? null,
    veterinario: text(raw.veterinario?.nombre, 'Veterinario no registrado'),
  }
}

export function ensureEditable(followUp) {
  if (followUp.estado === COMPLETED_STATE) throw new ApiError(COMPLETED_MESSAGE, { status: 409 })
}

export async function createFollowUp(fetchFn, values, apiUrl = DEFAULT_API_URL) {
  const body = await requestJson(fetchFn, `${apiUrl}/seguimientos`, {
    method: 'POST',
    body: buildFollowUpPayload(values),
    notFound: FOLLOWUP_REFS_NOT_FOUND,
    failure: 'El servidor no pudo programar el seguimiento en este momento.',
  })
  return isObject(body) ? normalizeFollowUp(body) : null
}

export async function updateFollowUp(fetchFn, id, values, apiUrl = DEFAULT_API_URL) {
  const body = await requestJson(fetchFn, `${apiUrl}/seguimientos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: buildFollowUpPayload(values),
    notFound: FOLLOWUP_NOT_FOUND,
    failure: 'El servidor no pudo actualizar el seguimiento en este momento.',
  })
  return isObject(body) ? normalizeFollowUp(body) : null
}

export async function deleteFollowUp(fetchFn, id, apiUrl = DEFAULT_API_URL) {
  await requestJson(fetchFn, `${apiUrl}/seguimientos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    notFound: FOLLOWUP_NOT_FOUND,
    failure: 'El servidor no pudo eliminar el seguimiento en este momento.',
  })
  return true
}

async function fetchFollowUpsOfPet(fetchFn, petId, apiUrl) {
  const all = expectList(await requestJson(fetchFn, `${apiUrl}/seguimientos`, {
    failure: 'El servidor no pudo entregar los seguimientos en este momento.',
  }))
  return all.filter((item) => String(item.mascota?.id) === String(petId))
}

// Si el detalle de la mascota ya trae sus seguimientos se usan; si no, se filtran del listado.
export async function fetchFollowUps(fetchFn, petId, apiUrl = DEFAULT_API_URL) {
  const error = validateId(petId, PET_ID_ERROR)
  if (error) throw new ApiError(error)

  const id = String(petId).trim()
  const pet = expectObject(await requestJson(fetchFn, `${apiUrl}/mascotas/${encodeURIComponent(id)}`, {
    notFound: PET_NOT_FOUND,
    failure: 'El servidor no pudo entregar la mascota en este momento.',
  }))
  const raw = Array.isArray(pet.seguimientos) ? pet.seguimientos : await fetchFollowUpsOfPet(fetchFn, id, apiUrl)

  return { petName: text(pet.nombre, 'Mascota sin nombre'), followUps: raw.map(normalizeFollowUp) }
}

export function renderFollowUps(followUps) {
  if (followUps.length === 0) return `<p class="admin-feedback" role="status">${NO_FOLLOWUPS_MESSAGE}</p>`

  const items = followUps.map((item) => {
    const next = item.proximaCita ? ` · próxima cita ${escapeHtml(item.proximaCita)}` : ''
    const note = item.observacion ? `<small>${escapeHtml(item.observacion)}</small>` : ''
    return `<li class="admin-record" data-testid="followup-item"><div class="admin-record-copy"><strong>${escapeHtml(item.fechaAsignacion)}${next}</strong><small>${escapeHtml(item.estado)} · ${escapeHtml(item.veterinario)}</small>${note}</div><div class="admin-record-actions"><button class="secondary-button" type="button" data-action="edit" data-id="${escapeHtml(item.id)}">Editar</button><button class="secondary-button danger-button" type="button" data-action="delete" data-id="${escapeHtml(item.id)}">Eliminar</button></div></li>`
  })
  return `<ul class="admin-record-list">${items.join('')}</ul>`
}
