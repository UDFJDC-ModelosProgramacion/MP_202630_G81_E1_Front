import { getApiUrl } from '../catalog/catalog.js'
import { mountAdminPage } from '../story-admin-page.js'
import { clearAlert, formMarkup, paintErrors, readValues, setText, showAlert } from '../admin-ui.js'
import { validateId } from '../api-client.js'
import { PET_FIELDS, PET_ID_ERROR, deletePet, registerPet, validatePet } from '../workflows/HU32.js'

const root = mountAdminPage({
  storyId: 'HU32',
  eyebrow: 'FUNCIONARIOS DEL REFUGIO',
  title: 'Registrar una mascota',
  description: 'Publica una mascota en la plataforma con su nombre, especie, edad y estado.',
  sidebar: {
    sidebarLabel: 'Ayuda para registrar una mascota',
    petStatus: 'Nueva mascota',
    petEmoji: '🐶',
    petTitle: 'Registro de mascotas',
    petTag: 'HU32',
    petSubtitle: 'Publicación en la plataforma',
    asideDescription: 'El nombre, la especie y el estado son obligatorios; la edad no puede ser negativa.',
    helpTitle: 'Antes de registrar',
    helpDescription: 'Si asocias un refugio, su número debe existir. Una mascota con seguimientos veterinarios no se puede eliminar.',
    helpLink: { href: './HU33.html', label: 'Ver el catálogo de mascotas' },
    asideNote: 'La mascota aparece en el catálogo apenas queda registrada.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU32 · MASCOTA</p><h2>Registrar mascota</h2><p>Los campos con * son obligatorios.</p></div></div>
    <p id="status" class="admin-feedback" role="status" aria-live="polite"></p>
    <div id="error" class="form-error-banner" role="alert" hidden></div>
    <form id="pet-form" class="admin-form" novalidate>
      ${formMarkup('pet', PET_FIELDS)}
      <div class="admin-actions"><button id="submit" class="submit-button" type="submit">Registrar mascota <span aria-hidden="true">→</span></button></div>
    </form>
    <section class="admin-recent">
      <h3>Eliminar una mascota</h3>
      <form id="delete-form" class="admin-form" novalidate>
        <div class="field"><label for="delete-id">Número de mascota a eliminar</label><input id="delete-id" inputmode="numeric" aria-describedby="delete-id-error" placeholder="Ej. 1"><small class="field-error" id="delete-id-error"></small></div>
        <div class="admin-actions"><button class="secondary-button danger-button" type="submit">Eliminar mascota</button></div>
      </form>
    </section>
  `,
})

const $ = (selector) => root.querySelector(selector)
const status = $('#status')
const banner = $('#error')
const submit = $('#submit')
const apiUrl = getApiUrl(import.meta.env)
const fetchFn = window.fetch.bind(window)

function fail(error) {
  setText(status, '')
  showAlert(banner, error.message)
}

$('#pet-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  clearAlert(banner)
  setText(status, '')

  const values = readValues(root, 'pet', PET_FIELDS)
  const errors = validatePet(values)
  paintErrors(root, 'pet', PET_FIELDS, errors)
  if (Object.keys(errors).length > 0) return

  submit.disabled = true
  setText(status, 'Registrando mascota…')
  try {
    await registerPet(fetchFn, values, apiUrl)
    setText(status, `Mascota «${values.nombre.trim()}» registrada correctamente.`)
    event.target.reset()
  } catch (error) {
    fail(error)
  } finally {
    submit.disabled = false
  }
})

$('#delete-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  clearAlert(banner)
  setText(status, '')
  setText($('#delete-id-error'), '')

  const id = $('#delete-id').value.trim()
  const idError = validateId(id, PET_ID_ERROR)
  if (idError) {
    setText($('#delete-id-error'), idError)
    return
  }
  if (!window.confirm('¿Seguro que quieres eliminar esta mascota?')) return

  try {
    await deletePet(fetchFn, id, apiUrl)
    setText(status, 'Mascota eliminada correctamente.')
    event.target.reset()
  } catch (error) {
    fail(error)
  }
})
