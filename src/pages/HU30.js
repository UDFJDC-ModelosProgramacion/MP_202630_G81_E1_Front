import { getApiUrl } from '../catalog/catalog.js'
import { mountAdminPage } from '../story-admin-page.js'
import {
  SHELTER_FIELDS,
  SHELTER_NOT_FOUND,
  createShelter,
  fetchShelter,
  parseShelterRoute,
  successMessage,
  updateShelter,
  validateShelter,
} from '../workflows/HU30.js'

const FIELD_UI = {
  nombre: { label: 'Nombre', type: 'text', autocomplete: 'organization', placeholder: 'Ej. Refugio Huellitas' },
  ciudad: { label: 'Ciudad', type: 'text', autocomplete: 'address-level2', placeholder: 'Ej. Bogotá' },
  direccion: { label: 'Dirección', type: 'text', autocomplete: 'street-address', placeholder: 'Ej. Calle 10 # 5-20' },
  telefono: { label: 'Teléfono', type: 'tel', autocomplete: 'tel', placeholder: 'Ej. 300 123 4567' },
  correo: { label: 'Correo', type: 'email', autocomplete: 'email', placeholder: 'contacto@refugio.co' },
  descripcion: { label: 'Descripción', type: 'textarea', placeholder: 'Cuenta brevemente qué hace el refugio...' },
}

const fieldMarkup = ({ name }) => {
  const ui = FIELD_UI[name]
  const control = ui.type === 'textarea'
    ? `<textarea id="shelter-${name}" name="${name}" rows="4" placeholder="${ui.placeholder}" aria-describedby="shelter-${name}-error"></textarea>`
    : `<input id="shelter-${name}" name="${name}" type="${ui.type}" autocomplete="${ui.autocomplete}" placeholder="${ui.placeholder}" aria-describedby="shelter-${name}-error">`
  return `<div class="field"><label for="shelter-${name}">${ui.label} <span aria-hidden="true">*</span></label>${control}<small class="field-error" id="shelter-${name}-error"></small></div>`
}

const root = mountAdminPage({
  storyId: 'HU30',
  eyebrow: 'ADMINISTRACIÓN DEL REFUGIO',
  title: 'Gestionar refugios',
  description: 'Registra un refugio o actualiza sus datos de contacto.',
  sidebar: {
    sidebarLabel: 'Ayuda para gestionar refugios',
    petStatus: 'Panel del refugio',
    petEmoji: '🏠',
    petTitle: 'Datos de contacto',
    petTag: 'HU30',
    petSubtitle: 'Refugios aliados',
    asideDescription: 'Mantén al día el nombre, la ciudad, la dirección, el teléfono y el correo de cada refugio.',
    helpTitle: 'Registrar o editar',
    helpDescription: 'Sin número de refugio se registra uno nuevo; con un número se editan sus datos.',
    helpLink: { href: './HU33.html', label: 'Ver el catálogo de mascotas' },
    asideNote: 'Los visitantes usan estos datos para saber dónde conocer a las mascotas.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU30 · REFUGIO</p><h2 id="shelter-form-title">Registrar refugio</h2><p>Todos los campos son obligatorios.</p></div></div>
    <p id="shelter-status" class="admin-feedback" role="status" aria-live="polite"></p>
    <div id="shelter-error" class="form-error-banner" role="alert" hidden></div>
    <p><button id="shelter-retry" class="secondary-button" type="button" hidden>Reintentar</button></p>
    <p><a id="shelter-edit-link" href="./HU30.html" hidden>Editar este refugio</a></p>
    <form id="shelter-form" class="admin-form" novalidate>
      ${SHELTER_FIELDS.map(fieldMarkup).join('')}
      <div class="admin-actions">
        <button id="shelter-submit" class="submit-button" type="submit">Guardar refugio <span aria-hidden="true">→</span></button>
      </div>
    </form>
    <section class="admin-recent">
      <h3>Editar un refugio existente</h3>
      <form id="shelter-lookup" class="admin-form" novalidate>
        <div class="field"><label for="shelter-lookup-id">Número de refugio</label><input id="shelter-lookup-id" inputmode="numeric" placeholder="Ej. 1"></div>
        <div class="admin-actions"><button class="secondary-button" type="submit">Editar refugio</button></div>
      </form>
    </section>
  `,
})

const $ = (selector) => root.querySelector(selector)
const form = $('#shelter-form')
const status = $('#shelter-status')
const errorBanner = $('#shelter-error')
const submit = $('#shelter-submit')
const retry = $('#shelter-retry')
const editLink = $('#shelter-edit-link')

const fetchFn = window.fetch.bind(window)
const apiUrl = getApiUrl(import.meta.env)
const route = parseShelterRoute(window.location.search)
const field = (name) => $(`#shelter-${name}`)

function readValues() {
  return Object.fromEntries(SHELTER_FIELDS.map(({ name }) => [name, field(name).value]))
}

function paintErrors(errors) {
  for (const { name } of SHELTER_FIELDS) {
    const message = errors[name] ?? ''
    $(`#shelter-${name}-error`).textContent = message
    field(name).setAttribute('aria-invalid', String(Boolean(message)))
  }
  const firstInvalid = SHELTER_FIELDS.find(({ name }) => errors[name])
  if (firstInvalid) field(firstInvalid.name).focus()
}

function showError(message, { canRetry = false, hideForm = false } = {}) {
  status.textContent = ''
  errorBanner.textContent = message
  errorBanner.hidden = false
  retry.hidden = !canRetry
  form.hidden = hideForm
}

function clearMessages() {
  status.textContent = ''
  errorBanner.hidden = true
  retry.hidden = true
  editLink.hidden = true
}

async function loadShelter() {
  clearMessages()
  status.textContent = 'Cargando refugio…'
  form.hidden = true
  try {
    const shelter = await fetchShelter(fetchFn, route.id, apiUrl)
    for (const { name } of SHELTER_FIELDS) field(name).value = shelter[name]
    form.hidden = false
    status.textContent = ''
  } catch (error) {
    showError(error.message, { canRetry: error.status !== 404, hideForm: true })
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  clearMessages()

  const values = readValues()
  const errors = validateShelter(values)
  paintErrors(errors)
  if (Object.keys(errors).length > 0) return

  submit.disabled = true
  status.textContent = 'Guardando refugio…'
  try {
    const saved = route.editing
      ? await updateShelter(fetchFn, route.id, values, apiUrl)
      : await createShelter(fetchFn, values, apiUrl)

    status.textContent = successMessage(route.editing)
    if (!route.editing) {
      form.reset()
      if (saved.id !== null) {
        editLink.href = `./HU30.html?id=${encodeURIComponent(saved.id)}`
        editLink.hidden = false
      }
    }
  } catch (error) {
    showError(error.message, { hideForm: error.status === 404 })
  } finally {
    submit.disabled = false
  }
})

retry.addEventListener('click', loadShelter)

$('#shelter-lookup').addEventListener('submit', (event) => {
  event.preventDefault()
  const id = $('#shelter-lookup-id').value.trim()
  window.location.assign(`./HU30.html?id=${encodeURIComponent(id)}`)
})

if (route.editing) {
  $('#shelter-form-title').textContent = 'Editar refugio'
  document.title = 'HU30 · Editar refugio | Huellitas'
  if (route.id === null) showError(SHELTER_NOT_FOUND, { hideForm: true })
  else loadShelter()
}
