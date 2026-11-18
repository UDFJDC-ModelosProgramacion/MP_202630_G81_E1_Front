// HU31 - Consultar detalle de un refugio: lógica pura (sin DOM).
import { DEFAULT_API_URL, escapeHtml, formatAge, normalizePet, statusLabel } from '../catalog/catalog.js'
import { expectList, expectObject, requestJson } from '../api-client.js'
import { SHELTER_NOT_FOUND, normalizeShelter } from './HU30.js'

export const NO_PETS_MESSAGE = 'Este refugio no tiene mascotas registradas.'
const FAILURE = 'El servidor no pudo entregar la información del refugio en este momento.'

async function fetchPetsOfShelter(fetchFn, shelterId, apiUrl) {
  const all = expectList(await requestJson(fetchFn, `${apiUrl}/mascotas`, { failure: FAILURE }))
  return all.filter((pet) => String(pet.refugio?.id) === String(shelterId))
}

// Si el detalle del refugio ya trae sus mascotas se usan; si no, se filtran del listado de mascotas.
export async function fetchShelterDetail(fetchFn, id, apiUrl = DEFAULT_API_URL) {
  const raw = expectObject(await requestJson(fetchFn, `${apiUrl}/refugios/${encodeURIComponent(id)}`, {
    notFound: SHELTER_NOT_FOUND,
    failure: FAILURE,
  }))
  const rawPets = Array.isArray(raw.mascotas)
    ? raw.mascotas
    : await fetchPetsOfShelter(fetchFn, raw.id ?? id, apiUrl)

  return { shelter: normalizeShelter(raw), pets: rawPets.map(normalizePet) }
}

export function renderShelterDetail(shelter) {
  const rows = [
    ['Nombre', shelter.nombre],
    ['Ciudad', shelter.ciudad],
    ['Dirección', shelter.direccion],
    ['Teléfono', shelter.telefono],
    ['Correo', shelter.correo],
  ]
  const items = rows
    .map(([label, value]) => `<div class="detail-row"><dt>${label}</dt><dd>${escapeHtml(value || 'No registrado')}</dd></div>`)
    .join('')
  const description = shelter.descripcion
    ? `<p class="mt-4 text-sm">${escapeHtml(shelter.descripcion)}</p>`
    : ''

  return `<article class="pet-card" data-testid="shelter-detail"><h2>${escapeHtml(shelter.nombre || 'Refugio sin nombre')}</h2><dl class="mt-4 grid gap-3 sm:grid-cols-2">${items}</dl>${description}</article>`
}

export function renderShelterPets(pets) {
  if (pets.length === 0) return `<p class="catalog-message" role="status">${NO_PETS_MESSAGE}</p>`

  const items = pets.map((pet) => {
    const name = escapeHtml(pet.name)
    const title = pet.id === null
      ? name
      : `<a href="./HU33.html?id=${encodeURIComponent(pet.id)}">${name}</a>`
    return `<li class="admin-record" data-testid="shelter-pet"><div class="admin-record-copy"><strong>${title}</strong><small>${escapeHtml(pet.species)} · ${escapeHtml(pet.breed)} · ${escapeHtml(formatAge(pet.age))}</small></div><span class="record-badge">${escapeHtml(statusLabel(pet.status))}</span></li>`
  })
  return `<ul class="admin-record-list">${items.join('')}</ul>`
}
