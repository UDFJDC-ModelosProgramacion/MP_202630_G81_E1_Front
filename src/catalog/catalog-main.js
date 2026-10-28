// HU33 - Pet catalog: wires the DOM to the logic in catalog.js.
import './catalog.css'
import {
  ALL_FILTER,
  describeResults,
  fetchPets,
  filterPets,
  getApiUrl,
  getSpeciesOptions,
  renderPetList,
} from './catalog.js'

const $ = (selector) => document.querySelector(selector)
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
}

let allPets = []

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
    elements.emptyText.textContent = 'Aún no hay mascotas registradas. Vuelve pronto.'
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

elements.filters.addEventListener('input', render)
elements.filters.addEventListener('submit', (event) => event.preventDefault())
elements.retry.addEventListener('click', loadCatalog)
elements.clear.addEventListener('click', () => {
  elements.filters.reset()
  render()
  elements.search.focus()
})

loadCatalog()
