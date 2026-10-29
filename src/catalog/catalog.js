// HU33 - Pet catalog: pure logic (no DOM access) so it can be unit tested.

export const DEFAULT_API_URL = 'http://localhost:8080/api'

export const PET_STATES = ['Disponible', 'En proceso de adopcion', 'Adoptado']

export const ALL_FILTER = 'todos'

export class CatalogError extends Error {
  constructor(message, { status = null } = {}) {
    super(message)
    this.name = 'CatalogError'
    this.status = status
  }
}

export function getApiUrl(env = {}) {
  const configured = typeof env.VITE_API_URL === 'string' ? env.VITE_API_URL.trim() : ''
  return (configured || DEFAULT_API_URL).replace(/\/+$/, '')
}

export async function fetchPets(fetchFn, apiUrl = DEFAULT_API_URL) {
  let response
  try {
    response = await fetchFn(`${apiUrl}/mascotas`, { headers: { Accept: 'application/json' } })
  } catch {
    throw new CatalogError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  }

  if (!response.ok) {
    throw new CatalogError('El servidor no pudo entregar el catálogo en este momento.', {
      status: response.status,
    })
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new CatalogError('El servidor respondió con datos que no se pueden leer.')
  }

  if (!Array.isArray(data)) {
    throw new CatalogError('El servidor respondió con un formato inesperado.')
  }

  return data.map(normalizePet)
}

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
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
    status: text(raw.estado, 'Disponible'),
    shelterName: text(shelter.nombre, 'Refugio no registrado'),
    shelterCity: text(shelter.ciudad),
  }
}

export function formatAge(age) {
  if (age === null) return 'Edad no registrada'
  if (age === 0) return 'Menos de 1 año'
  return age === 1 ? '1 año' : `${age} años`
}

function normalize(value) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function filterPets(pets, { search = '', species = ALL_FILTER, status = ALL_FILTER } = {}) {
  const query = normalize(search.trim())
  return pets.filter((pet) => {
    if (species !== ALL_FILTER && pet.species !== species) return false
    if (status !== ALL_FILTER && pet.status !== status) return false
    if (!query) return true
    return [pet.name, pet.breed, pet.species].some((field) => normalize(field).includes(query))
  })
}

export function getSpeciesOptions(pets) {
  return [...new Set(pets.map((pet) => pet.species))].sort((a, b) => a.localeCompare(b, 'es'))
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

export function renderPetCard(pet) {
  const details = [pet.breed, formatAge(pet.age), pet.sex, pet.size].filter(Boolean)
  const place = [pet.shelterName, pet.shelterCity].filter(Boolean).join(' · ')
  const temperament = pet.temperament
    ? `<p class="mt-2 text-sm text-stone-600">${escapeHtml(pet.temperament)}</p>`
    : ''

  return `
    <li class="pet-card rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" data-testid="pet-card">
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-xl font-bold text-stone-900">${escapeHtml(pet.name)}</h3>
        <span class="status-badge rounded-full px-3 py-1 text-xs font-semibold" data-status="${escapeHtml(pet.status)}">${escapeHtml(statusLabel(pet.status))}</span>
      </div>
      <p class="mt-1 text-sm font-semibold text-orange-700">${escapeHtml(pet.species)}</p>
      <p class="mt-2 text-sm text-stone-700">${details.map(escapeHtml).join(' · ')}</p>
      ${temperament}
      <p class="mt-4 text-sm text-stone-500"><span aria-hidden="true">📍</span> ${escapeHtml(place)}</p>
    </li>`
}

export function renderPetList(pets) {
  return pets.map(renderPetCard).join('')
}

export function describeResults(shown, total) {
  if (total === 0) return 'Aún no hay mascotas registradas.'
  if (shown === total) return total === 1 ? 'Mostrando 1 mascota' : `Mostrando ${total} mascotas`
  return `Mostrando ${shown} de ${total} mascotas`
}
