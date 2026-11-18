import { getApiUrl } from '../catalog/catalog.js'
import { mountAdminPage } from '../story-admin-page.js'
import { clearAlert, fillValues, formMarkup, paintErrors, readValues, setText, showAlert } from '../admin-ui.js'
import {
  FOLLOWUP_FIELDS, createFollowUp, deleteFollowUp, ensureEditable, fetchFollowUps, renderFollowUps,
  updateFollowUp, validateFollowUp,
} from '../workflows/HU35.js'

const root = mountAdminPage({
  storyId: 'HU35',
  eyebrow: 'SALUD DE LAS MASCOTAS',
  title: 'Seguimientos veterinarios',
  description: 'Programa un seguimiento con su fecha de asignación y próxima cita, y consulta los de una mascota.',
  sidebar: {
    sidebarLabel: 'Ayuda para los seguimientos veterinarios',
    petStatus: 'Control de salud',
    petEmoji: '💉',
    petTitle: 'Seguimientos',
    petTag: 'HU35',
    petSubtitle: 'Citas y observaciones',
    asideDescription: 'Cada seguimiento se asocia a una mascota y a un veterinario que deben existir.',
    helpTitle: 'Reglas del seguimiento',
    helpDescription: 'La próxima cita no puede ser anterior a la fecha de asignación, y un seguimiento «Completado» no se modifica ni se elimina.',
    helpLink: { href: './HU34.html', label: 'Registrar veterinarios' },
    asideNote: 'Consulta los seguimientos de una mascota con su número.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU35 · SEGUIMIENTO</p><h2 id="form-title">Programar seguimiento</h2><p>Los campos con * son obligatorios.</p></div></div>
    <p id="status" class="admin-feedback" role="status" aria-live="polite"></p>
    <div id="error" class="form-error-banner" role="alert" hidden></div>
    <form id="followup-form" class="admin-form" novalidate>
      ${formMarkup('fu', FOLLOWUP_FIELDS)}
      <div class="admin-actions">
        <button id="submit" class="submit-button" type="submit">Programar seguimiento <span aria-hidden="true">→</span></button>
        <button id="cancel" class="secondary-button" type="button" hidden>Cancelar edición</button>
      </div>
    </form>
    <section class="admin-recent">
      <h3>Seguimientos de una mascota</h3>
      <form id="lookup-form" class="admin-form" novalidate>
        <div class="field"><label for="lookup-id">Número de la mascota a consultar</label><input id="lookup-id" inputmode="numeric" aria-describedby="lookup-id-error" placeholder="Ej. 1"><small class="field-error" id="lookup-id-error"></small></div>
        <div class="admin-actions"><button class="secondary-button" type="submit">Consultar seguimientos</button></div>
      </form>
      <p id="list-status" class="admin-feedback" role="status" aria-live="polite"></p>
      <div id="list-error" class="form-error-banner" role="alert" hidden></div>
      <div id="followup-list"></div>
    </section>
  `,
})

const $ = (selector) => root.querySelector(selector)
const status = $('#status')
const banner = $('#error')
const form = $('#followup-form')
const submit = $('#submit')
const cancel = $('#cancel')
const apiUrl = getApiUrl(import.meta.env)
const fetchFn = window.fetch.bind(window)

let currentPetId = null
let followUps = []
let editingId = null

function resetEditing() {
  editingId = null
  $('#form-title').textContent = 'Programar seguimiento'
  submit.firstChild.textContent = 'Programar seguimiento '
  cancel.hidden = true
}

async function loadList(petId) {
  clearAlert($('#list-error'))
  setText($('#list-status'), 'Cargando seguimientos…')
  try {
    const result = await fetchFollowUps(fetchFn, petId, apiUrl)
    currentPetId = String(petId).trim()
    followUps = result.followUps
    $('#followup-list').innerHTML = renderFollowUps(followUps)
    setText($('#list-status'), `Mascota: ${result.petName}`)
  } catch (error) {
    setText($('#list-status'), '')
    $('#followup-list').innerHTML = ''
    showAlert($('#list-error'), error.message)
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  clearAlert(banner)
  setText(status, '')

  const values = readValues(root, 'fu', FOLLOWUP_FIELDS)
  const errors = validateFollowUp(values)
  paintErrors(root, 'fu', FOLLOWUP_FIELDS, errors)
  if (Object.keys(errors).length > 0) return

  submit.disabled = true
  setText(status, 'Guardando seguimiento…')
  try {
    if (editingId === null) await createFollowUp(fetchFn, values, apiUrl)
    else await updateFollowUp(fetchFn, editingId, values, apiUrl)
    setText(status, editingId === null ? 'Seguimiento programado correctamente.' : 'Seguimiento actualizado correctamente.')
    form.reset()
    resetEditing()
    if (currentPetId !== null) loadList(currentPetId)
  } catch (error) {
    setText(status, '')
    showAlert(banner, error.message)
  } finally {
    submit.disabled = false
  }
})

$('#lookup-form').addEventListener('submit', (event) => {
  event.preventDefault()
  setText($('#lookup-id-error'), '')
  loadList($('#lookup-id').value)
})

cancel.addEventListener('click', () => {
  form.reset()
  resetEditing()
})

$('#followup-list').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return

  clearAlert(banner)
  setText(status, '')
  const item = followUps.find((candidate) => String(candidate.id) === button.dataset.id)

  try {
    ensureEditable(item)
    if (button.dataset.action === 'edit') {
      fillValues(root, 'fu', FOLLOWUP_FIELDS, {
        ...item,
        mascotaId: item.mascotaId ?? currentPetId,
        veterinarioId: item.veterinarioId ?? '',
      })
      editingId = item.id
      $('#form-title').textContent = 'Editar seguimiento'
      submit.firstChild.textContent = 'Guardar cambios '
      cancel.hidden = false
      $('#fu-fechaAsignacion').focus()
      return
    }

    if (!window.confirm('¿Seguro que quieres eliminar este seguimiento?')) return
    await deleteFollowUp(fetchFn, item.id, apiUrl)
    setText(status, 'Seguimiento eliminado correctamente.')
    loadList(currentPetId)
  } catch (error) {
    showAlert(banner, error.message)
  }
})
