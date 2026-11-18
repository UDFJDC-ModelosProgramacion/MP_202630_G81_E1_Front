import { getApiUrl } from '../catalog/catalog.js'
import { mountAdminPage } from '../story-admin-page.js'
import { clearAlert, formMarkup, paintErrors, readValues, setText, showAlert } from '../admin-ui.js'
import { VET_FIELDS, fetchVet, fetchVets, registerVet, renderVetCard, renderVetList, validateVet } from '../workflows/HU34.js'

const root = mountAdminPage({
  storyId: 'HU34',
  eyebrow: 'ADMINISTRACIÓN DEL REFUGIO',
  title: 'Registrar veterinarios',
  description: 'Registra a los veterinarios de un refugio con su especialidad y disponibilidad.',
  sidebar: {
    sidebarLabel: 'Ayuda para registrar veterinarios',
    petStatus: 'Equipo veterinario',
    petEmoji: '🩺',
    petTitle: 'Veterinarios',
    petTag: 'HU34',
    petSubtitle: 'Quién cuida a las mascotas',
    asideDescription: 'Cada veterinario queda asociado a un refugio, que debe existir.',
    helpTitle: 'Registrar o consultar',
    helpDescription: 'Llena el formulario para registrar, revisa la lista de veterinarios o consulta uno por su número.',
    helpLink: { href: './HU35.html', label: 'Programar un seguimiento' },
    asideNote: 'Los veterinarios programan los seguimientos de salud de cada mascota.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU34 · VETERINARIO</p><h2>Registrar veterinario</h2><p>Todos los campos son obligatorios.</p></div></div>
    <p id="status" class="admin-feedback" role="status" aria-live="polite"></p>
    <div id="error" class="form-error-banner" role="alert" hidden></div>
    <form id="vet-form" class="admin-form" novalidate>
      ${formMarkup('vet', VET_FIELDS)}
      <div class="admin-actions"><button id="submit" class="submit-button" type="submit">Registrar veterinario <span aria-hidden="true">→</span></button></div>
    </form>
    <section class="admin-recent">
      <h3>Veterinarios registrados</h3>
      <p id="list-status" class="admin-feedback" role="status" aria-live="polite"></p>
      <div id="list-error" class="form-error-banner" role="alert" hidden></div>
      <p><button id="list-retry" class="secondary-button" type="button" hidden>Reintentar</button></p>
      <div id="vet-list"></div>
    </section>
    <section class="admin-recent">
      <h3>Consultar un veterinario</h3>
      <form id="lookup-form" class="admin-form" novalidate>
        <div class="field"><label for="lookup-id">Número de veterinario</label><input id="lookup-id" inputmode="numeric" aria-describedby="lookup-id-error" placeholder="Ej. 1"><small class="field-error" id="lookup-id-error"></small></div>
        <div class="admin-actions"><button class="secondary-button" type="submit">Consultar veterinario</button></div>
      </form>
      <div id="lookup-error" class="form-error-banner" role="alert" hidden></div>
      <div id="vet-detail"></div>
    </section>
  `,
})

const $ = (selector) => root.querySelector(selector)
const status = $('#status')
const banner = $('#error')
const submit = $('#submit')
const apiUrl = getApiUrl(import.meta.env)
const fetchFn = window.fetch.bind(window)

async function loadList() {
  clearAlert($('#list-error'))
  $('#list-retry').hidden = true
  setText($('#list-status'), 'Cargando veterinarios…')
  try {
    $('#vet-list').innerHTML = renderVetList(await fetchVets(fetchFn, apiUrl))
    setText($('#list-status'), '')
  } catch (error) {
    setText($('#list-status'), '')
    showAlert($('#list-error'), error.message)
    $('#list-retry').hidden = false
  }
}

$('#vet-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  clearAlert(banner)
  setText(status, '')

  const values = readValues(root, 'vet', VET_FIELDS)
  const errors = validateVet(values)
  paintErrors(root, 'vet', VET_FIELDS, errors)
  if (Object.keys(errors).length > 0) return

  submit.disabled = true
  setText(status, 'Registrando veterinario…')
  try {
    await registerVet(fetchFn, values, apiUrl)
    setText(status, `Veterinario «${values.nombre.trim()}» registrado correctamente.`)
    event.target.reset()
    loadList()
  } catch (error) {
    setText(status, '')
    showAlert(banner, error.message)
  } finally {
    submit.disabled = false
  }
})

$('#lookup-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  clearAlert($('#lookup-error'))
  $('#vet-detail').innerHTML = ''
  setText($('#lookup-id-error'), '')
  try {
    $('#vet-detail').innerHTML = renderVetCard(await fetchVet(fetchFn, $('#lookup-id').value, apiUrl))
  } catch (error) {
    showAlert($('#lookup-error'), error.message)
  }
})

$('#list-retry').addEventListener('click', loadList)

loadList()
