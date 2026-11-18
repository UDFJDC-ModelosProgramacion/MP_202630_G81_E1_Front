// HU33 - Catálogo de mascotas: lógica pura (sin DOM) para poder probarla con pruebas unitarias.
// También la usan HU30, HU31, HU32, HU34 y HU35 (URL del API, normalización de mascotas y escapeHtml).
import { expectList, expectObject, parseIdParam, requestJson, text } from '../api-client.js'

export const DEFAULT_API_URL = 'http://localhost:8080/api'

export const PET_STATES = ['Disponible', 'En proceso de adopcion', 'Adoptado']

export const ALL_FILTER = 'todos'

export const EMPTY_CATALOG_MESSAGE = 'No hay mascotas disponibles.'

export const PET_NOT_FOUND = 'La mascota no fue encontrada.'

const CATALOG_FAILURE = 'El servidor no pudo entregar el catálogo en este momento.'

export function getApiUrl(env = {}) {
  const configured = typeof env.VITE_API_URL === 'string' ? env.VITE_API_URL.trim() : ''
  return (configured || DEFAULT_API_URL).replace(/\/+$/, '')
}

export async function fetchPets(fetchFn, apiUrl = DEFAULT_API_URL) {
  const body = await requestJson(fetchFn, `${apiUrl}/mascotas`, { failure: CATALOG_FAILURE })
  return expectList(body).map(normalizePet)
}

export async function fetchPet(fetchFn, id, apiUrl = DEFAULT_API_URL) {
  const body = await requestJson(fetchFn, `${apiUrl}/mascotas/${encodeURIComponent(id)}`, {
    notFound: PET_NOT_FOUND,
    failure: CATALOG_FAILURE,
  })
  return normalizePet(expectObject(body))
}

export function parsePetRoute(search = '') {
  const { present, id } = parseIdParam(search)
  return { detail: present, id }
}

export function normalizePet(raw) {
  const shelter = raw.refugio ?? {}
  return {
    id: raw.id ?? null,
    name: text(raw.nombre, 'Sin nombre'),
    species: text(raw.especie, 'Sin especie'),
    breed: text(raw.raza, 'Raza no registrada'),
    age: Number.isInteger(raw.edad) && raw.edad >= 0 ? raw.edad : null,
    sex: text(raw.sexo),
    size: text(raw.tamano),
    temperament: text(raw.temperamento),
    status: text(raw.estado, 'Estado no registrado'),
    shelterId: shelter.id ?? null,
    shelterName: text(shelter.nombre, 'Refugio no registrado'),
    shelterCity: text(shelter.ciudad),
  }
}

export function formatAge(age) {
  if (age === null) return 'Edad no registrada'
  if (age === 0) return 'Menos de 1 año'
  return age === 1 ? '1 año' : `${age} años`
}

// Compara sin tildes ni mayúsculas: "Félix" y "felix", o "Perro" y "perro", son lo mismo.
function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function filterPets(pets, { search = '', species = ALL_FILTER, status = ALL_FILTER } = {}) {
  const query = normalize(search.trim())
  const wantedSpecies = normalize(species)
  return pets.filter((pet) => {
    if (species !== ALL_FILTER && normalize(pet.species) !== wantedSpecies) return false
    if (status !== ALL_FILTER && pet.status !== status) return false
    if (!query) return true
    return [pet.name, pet.breed, pet.species].some((field) => normalize(field).includes(query))
  })
}

// La especie se escribe libre en HU32, así que «perro» y «Perro» deben salir una sola vez.
export function getSpeciesOptions(pets) {
  const unique = new Map()
  for (const pet of pets) {
    const key = normalize(pet.species)
    if (!unique.has(key)) unique.set(key, pet.species)
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b, 'es'))
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function statusLabel(status) {
  return status === 'En proceso de adopcion' ? 'En proceso de adopción' : status
}

const place = (pet) => [pet.shelterName, pet.shelterCity].filter(Boolean).join(' · ')

const statusBadge = (pet) => `<span class="status-badge" data-status="${escapeHtml(pet.status)}">${escapeHtml(statusLabel(pet.status))}</span>`

export function renderPetCard(pet) {
  const details = [pet.breed, formatAge(pet.age), pet.sex, pet.size].filter(Boolean)
  const temperament = pet.temperament
    ? `<p class="pet-note">${escapeHtml(pet.temperament)}</p>`
    : ''
  const detailLink = pet.id === null
    ? ''
    : `<a class="secondary-button pet-link" href="./HU33.html?id=${encodeURIComponent(pet.id)}" aria-label="Ver detalle de ${escapeHtml(pet.name)}">Ver detalle</a>`

  return `
    <li class="pet-card" data-testid="pet-card">
      <div class="pet-card-head">
        <h3>${escapeHtml(pet.name)}</h3>
        ${statusBadge(pet)}
      </div>
      <p class="pet-species">${escapeHtml(pet.species)}</p>
      <p class="pet-meta">${details.map(escapeHtml).join(' · ')}</p>
      ${temperament}
      <p class="pet-place"><span aria-hidden="true">📍</span> ${escapeHtml(place(pet))}</p>
      ${detailLink}
    </li>`
}

export function renderPetList(pets) {
  return pets.map(renderPetCard).join('')
}

export function describeResults(shown, total) {
  if (total === 0) return EMPTY_CATALOG_MESSAGE
  if (shown === total) return total === 1 ? 'Mostrando 1 mascota' : `Mostrando ${total} mascotas`
  return `Mostrando ${shown} de ${total} mascotas`
}

export function renderPetDetail(pet) {
  const rows = [
    ['Especie', pet.species],
    ['Raza', pet.breed],
    ['Edad', formatAge(pet.age)],
    ['Sexo', pet.sex || 'No registrado'],
    ['Tamaño', pet.size || 'No registrado'],
    ['Temperamento', pet.temperament || 'No registrado'],
    ['Refugio', place(pet)],
  ]
  const items = rows
    .map(([label, value]) => `<div class="detail-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('')
  const shelterLink = pet.shelterId === null
    ? ''
    : `<p class="pet-actions"><a href="./HU31.html?id=${encodeURIComponent(pet.shelterId)}">Ver datos de contacto del refugio</a></p>`

  return `
    <article class="pet-card" data-testid="pet-detail">
      <div class="pet-card-head">
        <h2>${escapeHtml(pet.name)}</h2>
        ${statusBadge(pet)}
      </div>
      <dl class="detail-list">${items}</dl>
      ${shelterLink}
    </article>`
}
