// HU33 - Pet catalog: wires the DOM to the logic in catalog.js.
import '../style.css'
import './catalog.css'
import { renderStoryLinks } from '../story-navigation.js'
import { renderStorySidebar } from '../story-sidebar.js'
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
} from './catalog.js'

const $ = (selector) => document.querySelector(selector)
const elements = {
  storyNavigation: $('#story-navigation'),
  storySidebar: $('#story-sidebar'),
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

const route = parsePetRoute(window.location.search)

let allPets = []

elements.storyNavigation.innerHTML = renderStoryLinks('HU33')
elements.storySidebar.innerHTML = renderStorySidebar({
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
})

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
  const selected = elements.species.value
  elements.species.innerHTML = '<option value="todos">Todas</option>'
  for (const species of getSpeciesOptions(allPets)) {
    const option = document.createElement('option')
    option.value = species
    option.textContent = species
    elements.species.append(option)
  }
  elements.species.value = getSpeciesOptions(allPets).includes(selected) ? selected : ALL_FILTER
}

function render() {
  const filters = currentFilters()
  const shown = filterPets(allPets, filters)
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
  showOnly('loading')
  elements.summary.textContent = ''
  try {
    allPets = await fetchPets(window.fetch.bind(window), getApiUrl(import.meta.env))
    fillSpeciesOptions()
    render()
  } catch (error) {
    elements.errorText.textContent = error.message
    elements.summary.textContent = ''
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
    const pet = await fetchPet(window.fetch.bind(window), route.id, getApiUrl(import.meta.env))
    document.title = `${pet.name} · Catálogo de mascotas | AdoptaPet`
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
