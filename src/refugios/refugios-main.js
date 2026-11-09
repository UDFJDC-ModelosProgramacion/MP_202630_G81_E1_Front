// HU30 - Shelter management: wires the DOM to the logic in refugios.js.
import '../catalog/catalog.css'
import './refugios.css'
import { getApiUrl } from '../catalog/catalog.js'
import {
  SHELTER_FIELDS,
  SHELTER_NOT_FOUND,
  createShelter,
  fetchShelter,
  parseShelterRoute,
  successMessage,
  updateShelter,
  validateShelter,
} from './refugios.js'

const $ = (selector) => document.querySelector(selector)
const elements = {
  title: $('#shelter-title'),
  form: $('#shelter-form'),
  submit: $('#submit'),
  loading: $('#loading'),
  error: $('#error'),
  errorText: $('#error-text'),
  retry: $('#retry'),
  success: $('#success'),
  successText: $('#success-text'),
  editLink: $('#edit-link'),
}

const fetchFn = window.fetch.bind(window)
const apiUrl = getApiUrl(import.meta.env)
const route = parseShelterRoute(window.location.search)

function field(name) {
  return document.getElementById(name)
}

function readValues() {
  return Object.fromEntries(SHELTER_FIELDS.map(({ name }) => [name, field(name).value]))
}

function fillValues(shelter) {
  for (const { name } of SHELTER_FIELDS) field(name).value = shelter[name]
}

function paintErrors(errors) {
  for (const { name } of SHELTER_FIELDS) {
    const message = errors[name] ?? ''
    document.getElementById(`${name}-error`).textContent = message
    field(name).setAttribute('aria-invalid', String(Boolean(message)))
  }
  const firstInvalid = SHELTER_FIELDS.find(({ name }) => errors[name])
  if (firstInvalid) field(firstInvalid.name).focus()
}

function clearMessages() {
  elements.error.hidden = true
  elements.success.hidden = true
}

function showError(message, { canRetry = false, hideForm = false } = {}) {
  elements.errorText.textContent = message
  elements.retry.hidden = !canRetry
  elements.error.hidden = false
  elements.success.hidden = true
  elements.form.hidden = hideForm
}

async function loadShelter() {
  clearMessages()
  elements.loading.hidden = false
  elements.form.hidden = true
  try {
    fillValues(await fetchShelter(fetchFn, route.id, apiUrl))
    elements.form.hidden = false
  } catch (error) {
    showError(error.message, { canRetry: error.status !== 404, hideForm: true })
  } finally {
    elements.loading.hidden = true
  }
}

async function save(event) {
  event.preventDefault()
  clearMessages()

  const values = readValues()
  const errors = validateShelter(values)
  paintErrors(errors)
  if (Object.keys(errors).length > 0) return

  elements.submit.disabled = true
  elements.submit.textContent = 'Guardando…'
  try {
    const saved = route.editing
      ? await updateShelter(fetchFn, route.id, values, apiUrl)
      : await createShelter(fetchFn, values, apiUrl)

    elements.successText.textContent = successMessage(route.editing)
    elements.editLink.hidden = route.editing || saved.id === null
    if (!elements.editLink.hidden) elements.editLink.href = `/refugio.html?id=${encodeURIComponent(saved.id)}`
    elements.success.hidden = false
    if (!route.editing) elements.form.reset()
  } catch (error) {
    showError(error.message, { canRetry: false, hideForm: error.status === 404 })
  } finally {
    elements.submit.disabled = false
    elements.submit.textContent = 'Guardar refugio'
  }
}

elements.form.addEventListener('submit', save)
elements.retry.addEventListener('click', loadShelter)

if (route.editing) {
  elements.title.textContent = 'Editar refugio'
  document.title = 'Editar refugio | AdoptaPet'
  if (route.id === null) showError(SHELTER_NOT_FOUND, { hideForm: true })
  else loadShelter()
}
