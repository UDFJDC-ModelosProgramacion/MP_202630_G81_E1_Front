import { getApiUrl } from '../catalog/catalog.js'
import { mountAdminPage } from '../story-admin-page.js'
import { parseIdParam, validateId } from '../api-client.js'
import { clearAlert, setText, showAlert } from '../admin-ui.js'
import { SHELTER_NOT_FOUND } from '../workflows/HU30.js'
import { fetchShelterDetail, renderShelterDetail, renderShelterPets } from '../workflows/HU31.js'

const root = mountAdminPage({
  storyId: 'HU31',
  eyebrow: 'DÓNDE CONOCERLAS',
  title: 'Detalle de un refugio',
  description: 'Consulta los datos de contacto de un refugio y las mascotas que tiene registradas.',
  sidebar: {
    sidebarLabel: 'Ayuda para consultar un refugio',
    petStatus: 'Información pública',
    petEmoji: '📍',
    petTitle: 'Conoce un refugio',
    petTag: 'HU31',
    petSubtitle: 'Datos de contacto',
    asideDescription: 'Aquí encuentras la dirección, el teléfono y el correo del refugio, y las mascotas que te esperan.',
    helpTitle: 'Cómo consultar',
    helpDescription: 'Escribe el número del refugio, o ábrelo con HU31.html?id=1.',
    helpLink: { href: './HU33.html', label: 'Ver el catálogo de mascotas' },
    asideNote: 'Toca el nombre de una mascota para ver su detalle completo.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU31 · REFUGIO</p><h2>Consultar un refugio</h2></div></div>
    <form id="lookup-form" class="admin-form" novalidate>
      <div class="field"><label for="lookup-id">Número de refugio</label><input id="lookup-id" inputmode="numeric" aria-describedby="lookup-id-error" placeholder="Ej. 1"><small class="field-error" id="lookup-id-error"></small></div>
      <div class="admin-actions"><button class="submit-button" type="submit">Consultar refugio <span aria-hidden="true">→</span></button></div>
    </form>
    <p id="status" class="admin-feedback" role="status" aria-live="polite"></p>
    <div id="error" class="form-error-banner" role="alert" hidden></div>
    <p><button id="retry" class="secondary-button" type="button" hidden>Reintentar</button></p>
    <div id="shelter" hidden></div>
    <p><a id="edit-link" href="./HU30.html" hidden>Editar los datos de este refugio</a></p>
    <section id="pets-section" class="admin-recent" hidden><h3>Mascotas del refugio</h3><div id="pets"></div></section>
  `,
})

const $ = (selector) => root.querySelector(selector)
const status = $('#status')
const banner = $('#error')
const retry = $('#retry')
const route = parseIdParam(window.location.search)
const apiUrl = getApiUrl(import.meta.env)
const fetchFn = window.fetch.bind(window)

function showFailure(message, canRetry) {
  setText(status, '')
  showAlert(banner, message)
  retry.hidden = !canRetry
}

async function load() {
  clearAlert(banner)
  retry.hidden = true
  $('#shelter').hidden = true
  $('#pets-section').hidden = true
  $('#edit-link').hidden = true
  setText(status, 'Cargando refugio…')
  try {
    const { shelter, pets } = await fetchShelterDetail(fetchFn, route.id, apiUrl)
    $('#shelter').innerHTML = renderShelterDetail(shelter)
    $('#pets').innerHTML = renderShelterPets(pets)
    $('#edit-link').href = `./HU30.html?id=${encodeURIComponent(route.id)}`
    $('#shelter').hidden = false
    $('#pets-section').hidden = false
    $('#edit-link').hidden = false
    setText(status, '')
  } catch (error) {
    showFailure(error.message, error.status !== 404)
  }
}

$('#lookup-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const value = $('#lookup-id').value.trim()
  const message = validateId(value, 'Ingresa el número del refugio.')
  setText($('#lookup-id-error'), message)
  if (!message) window.location.assign(`./HU31.html?id=${encodeURIComponent(value)}`)
})

retry.addEventListener('click', load)

if (route.present) {
  if (route.id === null) showFailure(SHELTER_NOT_FOUND, false)
  else load()
}
