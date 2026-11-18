// HU34 - Registrar veterinarios de un refugio: lógica pura (sin DOM).
import { DEFAULT_API_URL, escapeHtml } from '../catalog/catalog.js'
import {
  ApiError, expectList, expectObject, isEmail, isId, isObject, requestJson, requiredErrors, text,
  trimValues, validateId,
} from '../api-client.js'

export const VET_NOT_FOUND = 'El veterinario no fue encontrado.'
export const VET_REFUGIO_NOT_FOUND = 'El refugio indicado no existe.'
export const VET_ID_ERROR = 'Ingresa el número del veterinario.'
export const NO_VETS_MESSAGE = 'Aún no hay veterinarios registrados.'

// Las claves son los nombres de los campos que envía el API (VeterinarioDTO).
export const VET_FIELDS = [
  { name: 'nombre', label: 'Nombre', required: 'El nombre es obligatorio.' },
  { name: 'telefono', label: 'Teléfono', type: 'tel', required: 'El teléfono es obligatorio.' },
  { name: 'correo', label: 'Correo', type: 'email', required: 'El correo es obligatorio.' },
  { name: 'especialidad', label: 'Especialidad', required: 'La especialidad es obligatoria.' },
  { name: 'disponibilidad', label: 'Disponibilidad', required: 'La disponibilidad es obligatoria.' },
  { name: 'refugioId', label: 'Número de refugio', type: 'number', required: 'El número de refugio es obligatorio.' },
]

export function validateVet(values) {
  const clean = trimValues(values, VET_FIELDS)
  const errors = requiredErrors(clean, VET_FIELDS)

  if (clean.correo && !isEmail(clean.correo)) errors.correo = 'Ingresa un correo válido, por ejemplo nombre@dominio.com.'
  if (clean.refugioId && !isId(clean.refugioId)) errors.refugioId = 'El número de refugio debe ser un número positivo.'

  return errors
}

export function buildVetPayload(values) {
  const clean = trimValues(values, VET_FIELDS)
  return {
    nombre: clean.nombre,
    telefono: clean.telefono,
    email: clean.correo,
    especialidad: clean.especialidad,
    disponibilidad: clean.disponibilidad,
    refugio: { id: Number(clean.refugioId) },
  }
}

export function normalizeVet(raw) {
  return {
    id: raw.id ?? null,
    nombre: text(raw.nombre, 'Sin nombre'),
    telefono: text(raw.telefono),
    correo: text(raw.email ?? raw.correo),
    especialidad: text(raw.especialidad, 'Sin especialidad'),
    disponibilidad: text(raw.disponibilidad, 'No registrada'),
    refugio: text(raw.refugio?.nombre, 'Refugio no registrado'),
  }
}

export async function registerVet(fetchFn, values, apiUrl = DEFAULT_API_URL) {
  const body = await requestJson(fetchFn, `${apiUrl}/veterinarios`, {
    method: 'POST',
    body: buildVetPayload(values),
    notFound: VET_REFUGIO_NOT_FOUND,
    failure: 'El servidor no pudo registrar el veterinario en este momento.',
  })
  return isObject(body) ? normalizeVet(body) : null
}

export async function fetchVets(fetchFn, apiUrl = DEFAULT_API_URL) {
  const body = await requestJson(fetchFn, `${apiUrl}/veterinarios`, {
    failure: 'El servidor no pudo entregar los veterinarios en este momento.',
  })
  return expectList(body).map(normalizeVet)
}

export async function fetchVet(fetchFn, id, apiUrl = DEFAULT_API_URL) {
  const error = validateId(id, VET_ID_ERROR)
  if (error) throw new ApiError(error)

  const body = await requestJson(fetchFn, `${apiUrl}/veterinarios/${encodeURIComponent(String(id).trim())}`, {
    notFound: VET_NOT_FOUND,
    failure: 'El servidor no pudo entregar el veterinario en este momento.',
  })
  return normalizeVet(expectObject(body))
}

export function renderVetCard(vet) {
  const rows = [
    ['Especialidad', vet.especialidad],
    ['Disponibilidad', vet.disponibilidad],
    ['Teléfono', vet.telefono || 'No registrado'],
    ['Correo', vet.correo || 'No registrado'],
    ['Refugio', vet.refugio],
  ]
  const items = rows
    .map(([label, value]) => `<div class="detail-row"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('')
  return `<article class="pet-card" data-testid="vet-detail"><h2>${escapeHtml(vet.nombre)}</h2><dl class="mt-4 grid gap-3 sm:grid-cols-2">${items}</dl></article>`
}

export function renderVetList(vets) {
  if (vets.length === 0) return `<p class="admin-feedback" role="status">${NO_VETS_MESSAGE}</p>`

  const items = vets.map((vet) => `<li class="admin-record" data-testid="vet-item"><div class="admin-record-copy"><strong>${escapeHtml(vet.nombre)}</strong><small>${escapeHtml(vet.especialidad)} · ${escapeHtml(vet.disponibilidad)} · ${escapeHtml(vet.refugio)}</small></div></li>`)
  return `<ul class="admin-record-list">${items.join('')}</ul>`
}
