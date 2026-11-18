import '../catalog/catalog.css'
import { mountAdminPage } from '../story-admin-page.js'
import {
  ALL_FILTER,
  PET_NOT_FOUND,
  describeResults,
  fetchPet,
  fetchPets,
  filterPets,
  getApiUrl,
  getSpeciesOptions,
  parsePetRoute,
  renderPetDetail,
  renderPetList,
} from '../catalog/catalog.js'

const root = mountAdminPage({
  storyId: 'HU33',
  eyebrow: 'ELLAS Y ELLOS TE ESPERAN',
  title: 'Catálogo de mascotas',
  description: 'Explora las mascotas registradas en los refugios y encuentra a tu próximo compañero.',
  sidebar: {
    sidebarLabel: 'Información del catálogo',
    petStatus: 'API de refugios',
    petEmoji: '🐾',
    petTitle: 'Catálogo abierto',
    petTag: 'HU33',
    petSubtitle: 'Mascotas de refugios',
    asideDescription: 'Consulta las mascotas registradas y conoce su especie, edad, estado y refugio.',
    helpTitle: 'Encuentra una compañera',
    helpDescription: 'Combina los filtros de especie, estado o nombre para explorar las opciones disponibles.',
    helpLink: { href: './HU01.html', label: 'Ver galería de fotos' },
    asideNote: 'La disponibilidad depende de los registros del refugio.',
  },
  content: `
    <div id="catalog-view">
      <form id="filters" class="catalog-filters" role="search" aria-label="Filtros del catálogo" novalidate>
        <div class="field">
          <label for="search">Buscar por nombre o raza</label>
          <input id="search" name="search" type="search" autocomplete="off" placeholder="Ej. Mora, criollo">
        </div>
        <div class="field">
          <label for="species">Especie</label>
          <select id="species" name="species"><option value="todos">Todas</option></select>
        </div>
        <div class="field">
          <label for="status">Estado</label>
          <select id="status" name="status">
            <option value="todos">Todos</option>
            <option value="Disponible">Disponible</option>
            <option value="En proceso de adopcion">En proceso de adopción</option>
            <option value="Adoptado">Adoptado</option>
          </select>
        </div>
      </form>

      <p id="results-summary" class="admin-feedback" role="status" aria-live="polite"></p>

      <div id="loading" class="catalog-message" role="status" hidden>
        <span class="spinner" aria-hidden="true"></span> Cargando mascotas…
      </div>

      <div id="error" class="catalog-message catalog-error" role="alert" hidden>
        <p id="error-text"></p>
        <button id="retry" type="button" class="secondary-button">Reintentar</button>
      </div>

      <div id="empty" class="catalog-message" hidden>
        <p id="empty-text"></p>
        <button id="clear-filters" type="button" class="secondary-button" hidden>Limpiar filtros</button>
      </div>

      <ul id="pet-list" class="pet-grid" aria-label="Lista de mascotas"></ul>
    </div>

    <div id="detail-view" hidden>
      <p><a class="back-link" href="./HU33.html">← Volver al catálogo</a></p>

      <div id="detail-loading" class="catalog-message" role="status" hidden>
        <span class="spinner" aria-hidden="true"></span> Cargando detalle de la mascota…
      </div>

      <div id="detail-error" class="catalog-message catalog-error" role="alert" hidden>
        <p id="detail-error-text"></p>
        <button id="detail-retry" type="button" class="secondary-button">Reintentar</button>
      </div>

      <div id="pet-detail" hidden></div>
    </div>
  `,
})

const $ = (selector) => root.querySelector(selector)
const elements = {
  filters: $('#filters'),
  search: $('#search'),
  species: $('#species'),
  status: $('#status'),
  summary: $('#results-summary'),
  loading: $('#loading'),
  error: $('#error'),
  errorText: $('#error-text'),
  retry: $('#retry'),
  empty: $('#empty'),
  emptyText: $('#empty-text'),
  clear: $('#clear-filters'),
  list: $('#pet-list'),
  catalogView: $('#catalog-view'),
  detailView: $('#detail-view'),
  detailLoading: $('#detail-loading'),
  detailError: $('#detail-error'),
  detailErrorText: $('#detail-error-text'),
  detailRetry: $('#detail-retry'),
  detail: $('#pet-detail'),
}

const fetchFn = window.fetch.bind(window)
const apiUrl = getApiUrl(import.meta.env)
const route = parsePetRoute(window.location.search)

let allPets = []
let loaded = false

function showOnly(section) {
  elements.loading.hidden = section !== 'loading'
  elements.error.hidden = section !== 'error'
  elements.empty.hidden = section !== 'empty'
  elements.list.hidden = section !== 'list'
}

function currentFilters() {
  return {
    search: elements.search.value,
    species: elements.species.value,
    status: elements.status.value,
  }
}

function fillSpeciesOptions() {
  const options = getSpeciesOptions(allPets)
  const selected = elements.species.value
  elements.species.innerHTML = '<option value="todos">Todas</option>'
  for (const species of options) {
    const option = document.createElement('option')
    option.value = species
    option.textContent = species
    elements.species.append(option)
  }
  elements.species.value = options.includes(selected) ? selected : ALL_FILTER
}

function render() {
  // Mientras carga o si falló la carga no hay nada que filtrar: no se debe tapar el estado actual.
  if (!loaded) return

  const shown = filterPets(allPets, currentFilters())
  elements.summary.textContent = describeResults(shown.length, allPets.length)

  if (allPets.length === 0) {
    elements.emptyText.textContent = 'No hay mascotas disponibles por el momento. Vuelve pronto.'
    elements.clear.hidden = true
    showOnly('empty')
    return
  }

  if (shown.length === 0) {
    elements.emptyText.textContent = 'No encontramos mascotas con esos filtros.'
    elements.clear.hidden = false
    showOnly('empty')
    return
  }

  elements.list.innerHTML = renderPetList(shown)
  showOnly('list')
}

async function loadCatalog() {
  loaded = false
  showOnly('loading')
  elements.summary.textContent = ''
  try {
    allPets = await fetchPets(fetchFn, apiUrl)
    loaded = true
    fillSpeciesOptions()
    render()
  } catch (error) {
    elements.errorText.textContent = error.message
    showOnly('error')
  }
}

function showDetailOnly(section) {
  elements.detailLoading.hidden = section !== 'loading'
  elements.detailError.hidden = section !== 'error'
  elements.detail.hidden = section !== 'detail'
}

function showDetailError(message, canRetry) {
  elements.detailErrorText.textContent = message
  elements.detailRetry.hidden = !canRetry
  showDetailOnly('error')
}

async function loadDetail() {
  if (route.id === null) {
    showDetailError(PET_NOT_FOUND, false)
    return
  }

  showDetailOnly('loading')
  try {
    const pet = await fetchPet(fetchFn, route.id, apiUrl)
    document.title = `${pet.name} · Catálogo de mascotas | Huellitas`
    elements.detail.innerHTML = renderPetDetail(pet)
    showDetailOnly('detail')
  } catch (error) {
    showDetailError(error.message, error.status !== 404)
  }
}

elements.filters.addEventListener('input', render)
elements.filters.addEventListener('submit', (event) => event.preventDefault())
elements.retry.addEventListener('click', loadCatalog)
elements.clear.addEventListener('click', () => {
  elements.filters.reset()
  render()
  elements.search.focus()
})
elements.detailRetry.addEventListener('click', loadDetail)

if (route.detail) {
  elements.catalogView.hidden = true
  elements.detailView.hidden = false
  loadDetail()
} else {
  loadCatalog()
}
