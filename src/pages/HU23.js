import '../style.css'
import '../HU23.css'
import {
  filterUpdates,
  findUpdateById,
  getStoredUpdates,
} from '../workflows/HU23.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="site-header mx-auto flex items-center justify-between">
    <a class="brand" href="./index.html" aria-label="Huellitas, inicio">
      <span class="brand-mark" aria-hidden="true">🐾</span>
      <span>huellitas<span class="brand-dot">.</span></span>
    </a>
    <nav class="header-nav" id="primary-navigation" aria-label="Navegación principal">
      <a href="./index.html">Inicio</a>
      <a href="./actualizaciones.html">Registrar actualizaciones</a>
    </nav>
    <button class="menu-toggle" type="button" aria-label="Abrir navegación" aria-controls="primary-navigation" aria-expanded="false">
      <span></span><span></span>
    </button>
  </header>

  <main class="mx-auto w-full hu23-main">
    <section class="page-intro">
      <div class="intro-copy">
        <p class="eyebrow"><span class="eyebrow-dot"></span> HISTORIAL Y SEGUIMIENTO</p>
        <h1>Cada historia merece ser conocida.</h1>
        <p class="intro-text">Consulta las actualizaciones registradas para conocer el seguimiento de mascotas y adoptantes.</p>
      </div>
      <div class="intro-decoration" aria-hidden="true">
        <span class="sun-shape"></span>
        <span class="intro-paw">🐾</span>
        <span class="intro-sparkle sparkle-one">✳</span>
        <span class="intro-sparkle sparkle-two">✳</span>
      </div>
    </section>

    <div class="breadcrumb" aria-label="Ruta de navegación">
      <a href="./index.html">Huellitas</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">HU23 · Historial de actualizaciones</span>
    </div>

    <section class="hu23-panel" aria-labelledby="filters-title">
      <div class="hu23-heading">
        <p class="step-label">HU23 · CONSULTA DE HISTORIAL</p>
        <h2 id="filters-title">Encuentra una actualización</h2>
        <p>Utiliza los filtros para consultar los registros que necesitas.</p>
      </div>

      <form id="filters-form" class="hu23-filters">
        <div class="hu23-field">
          <label for="type-filter">Tipo de actualización</label>
          <select id="type-filter" name="type">
            <option value="todos">Todos los tipos</option>
            <option value="mascota">Mascota</option>
            <option value="adoptante">Adoptante</option>
          </select>
        </div>

        <div class="hu23-field">
          <label for="pet-filter">Identificador de mascota</label>
          <input id="pet-filter" name="petId" type="text" placeholder="Ej. MASC-001">
        </div>

        <div class="hu23-field">
          <label for="adopter-filter">Identificador de adoptante</label>
          <input id="adopter-filter" name="adopterId" type="text" placeholder="Ej. ADOP-001">
        </div>

        <div class="hu23-actions">
          <button class="submit-button" type="submit">Aplicar filtros</button>
          <button class="secondary-button" id="clear-filters" type="button">Limpiar filtros</button>
        </div>
      </form>
    </section>

    <section class="hu23-panel" aria-labelledby="search-title">
      <div class="hu23-heading">
        <p class="step-label">CONSULTA INDIVIDUAL</p>
        <h2 id="search-title">Buscar por identificador</h2>
        <p>Consulta una actualización puntual mediante su ID.</p>
      </div>

      <form id="search-form" class="hu23-search">
        <div class="hu23-field">
          <label for="update-id">Identificador de la actualización</label>
          <input id="update-id" name="id" type="text" placeholder="Ej. HU22-001">
        </div>
        <button class="submit-button" type="submit">Buscar actualización</button>
      </form>
      <p id="search-feedback" role="status" aria-live="polite"></p>
    </section>

    <section class="hu23-panel" aria-labelledby="results-title">
      <div class="hu23-results-heading">
        <div class="hu23-heading">
          <p class="step-label">REGISTROS DISPONIBLES</p>
          <h2 id="results-title">Historial de actualizaciones</h2>
        </div>
        <span id="results-count" class="hu23-count">0 registros</span>
      </div>

      <p id="empty-state" class="hu23-empty" hidden>No se encontraron actualizaciones para esta consulta.</p>
      <ul id="updates-list" class="hu23-list"></ul>
    </section>
  </main>

  <footer class="site-footer mx-auto flex items-center justify-between">
    <a class="brand footer-brand" href="./index.html">
      <span class="brand-mark" aria-hidden="true">🐾</span>
      <span>huellitas<span class="brand-dot">.</span></span>
    </a>
    <p>Con amor, cada historia encuentra su hogar.</p>
    <span>© 2026 Huellitas</span>
  </footer>
`

const filtersForm = document.querySelector('#filters-form')
const searchForm = document.querySelector('#search-form')
const updatesList = document.querySelector('#updates-list')
const emptyState = document.querySelector('#empty-state')
const resultsCount = document.querySelector('#results-count')
const searchFeedback = document.querySelector('#search-feedback')

let allUpdates = []


function formatDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('es-CO')
}

function renderUpdates(updates) {
  updatesList.replaceChildren()
  emptyState.hidden = updates.length > 0
  resultsCount.textContent = `${updates.length} ${updates.length === 1 ? 'registro' : 'registros'}`

  for (const update of updates) {
    const item = document.createElement('li')
    const heading = document.createElement('h3')
    const description = document.createElement('p')
    const type = document.createElement('span')
    const reference = document.createElement('p')
    const identifier = document.createElement('p')

    item.className = 'hu23-record'
    heading.textContent = update.title
    description.textContent = update.description
    type.className = 'hu23-tag'
    type.textContent = update.targetType === 'mascota' ? 'Mascota' : 'Adoptante'
    reference.textContent = `Relacionado con: ${update.targetId}`
    identifier.textContent = `ID: ${update.id} · Fecha: ${formatDate(update.createdAt)}`

    item.append(type, heading, description, reference, identifier)
    updatesList.append(item)
  }


}

function loadUpdates() {
  allUpdates = getStoredUpdates(window.localStorage)
  renderUpdates(allUpdates)
}

filtersForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const values = Object.fromEntries(new FormData(filtersForm).entries())
  const filtered = filterUpdates(allUpdates, values)

  searchFeedback.textContent = ''
  renderUpdates(filtered)
})

document.querySelector('#clear-filters').addEventListener('click', () => {
  filtersForm.reset()
  searchFeedback.textContent = ''
  renderUpdates(allUpdates)
})

searchForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const values = Object.fromEntries(new FormData(searchForm).entries())
  const update = findUpdateById(allUpdates, values.id)

  if (!update) {
    searchFeedback.textContent = 'La actualización solicitada no fue encontrada.'
    renderUpdates([])
    return
  }

  searchFeedback.textContent = 'Actualización encontrada.'
  renderUpdates([update])
})

document.querySelector('#update-id').addEventListener('input', () => {
  searchFeedback.textContent = ''
})

document.querySelector('.menu-toggle').addEventListener('click', (event) => {
  const button = event.currentTarget
  const expanded = button.getAttribute('aria-expanded') === 'true'

  button.setAttribute('aria-expanded', String(!expanded))
  button.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación')
  document.querySelector('.header-nav').classList.toggle('nav-open', !expanded)
})

loadUpdates()