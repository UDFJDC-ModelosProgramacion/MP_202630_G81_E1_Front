import { escapeHtml } from '../api/client.js'
import { ADOPTANTE_ERROR_MESSAGES, getStoredAdoptanteId } from '../workflows/HU09.js'
import { loadProfile, saveProfile, validateProfile } from '../workflows/HU10.js'
import { mountAdminPage } from '../story-admin-page.js'

const FIELDS = [
  ['nombre', 'Nombre completo', 'name'], ['email', 'Correo electrónico', 'email'],
  ['telefono', 'Teléfono de contacto', 'tel'], ['ciudad', 'Ciudad', 'address-level2'],
  ['direccion', 'Dirección', 'street-address'],
]

const root = mountAdminPage({
  storyId: 'HU10', eyebrow: 'MI CUENTA', title: 'Consultar y editar mi perfil',
  description: 'Revisa tus datos de adoptante y mantén tu información de contacto al día.',
  sidebar: {
    sidebarLabel: 'Ayuda para el perfil', petStatus: 'Perfil de adoptante', petEmoji: '🙋',
    petTitle: 'Tus datos', petTag: 'HU10', petSubtitle: 'Información de contacto',
    asideDescription: 'El refugio usa estos datos para ponerse en contacto contigo sobre tus solicitudes.',
    helpTitle: 'Antes de guardar',
    helpDescription: 'Todos los campos son obligatorios. Si cancelas, tus datos originales se conservan.',
    helpLink: { href: './HU09.html', label: 'Registrarme como adoptante' },
    asideNote: 'Mantener tu contacto vigente agiliza la adopción.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU10 · PERFIL</p><h2>Mi perfil de adoptante</h2><p>Consulta y actualiza tus datos.</p></div></div>
    <p id="profile-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <section id="profile-view" hidden>
      <ul id="profile-data" class="admin-record-list"></ul>
      <div class="admin-actions"><button id="profile-edit" class="submit-button" type="button">Editar perfil</button></div>
    </section>
    <form id="profile-form" class="admin-form" novalidate hidden>
      ${FIELDS.map(([name, label, autocomplete]) => `
        <div class="field"><label for="profile-${name}">${label} <span aria-hidden="true">*</span></label><input id="profile-${name}" name="${name}" autocomplete="${autocomplete}" required><small class="field-error" id="profile-${name}-error"></small></div>`).join('')}
      <div class="admin-actions"><button class="submit-button" type="submit">Guardar cambios</button><button id="profile-cancel" class="secondary-button" type="button">Cancelar</button></div>
    </form>
  `,
})

const feedback = root.querySelector('#profile-feedback')
const view = root.querySelector('#profile-view')
const form = root.querySelector('#profile-form')
const adoptanteId = getStoredAdoptanteId(window.localStorage)
let adoptante = null

function say(message) { feedback.textContent = message }

function renderProfile() {
  root.querySelector('#profile-data').innerHTML = FIELDS.map(([name, label]) => `
    <li class="admin-record"><div class="admin-record-copy"><strong>${label}</strong><small>${escapeHtml(adoptante[name])}</small></div></li>`).join('')
}

function clearErrors() {
  for (const [name] of FIELDS) {
    form.elements.namedItem(name).removeAttribute('aria-invalid')
    root.querySelector(`#profile-${name}-error`).textContent = ''
  }
}

function showForm(visible) {
  form.hidden = !visible
  view.hidden = visible
}

root.querySelector('#profile-edit').addEventListener('click', () => {
  for (const [name] of FIELDS) form.elements.namedItem(name).value = adoptante[name] ?? ''
  clearErrors()
  say('')
  showForm(true)
  form.elements.namedItem('nombre').focus()
})

root.querySelector('#profile-cancel').addEventListener('click', () => {
  clearErrors()
  say('Edición cancelada. Tus datos originales se conservaron.')
  showForm(false)
})

form.addEventListener('input', (event) => {
  event.target.removeAttribute('aria-invalid')
  root.querySelector(`#profile-${event.target.name}-error`).textContent = ''
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  clearErrors()
  const values = Object.fromEntries(new FormData(form).entries())
  const errors = validateProfile(values)
  const invalid = Object.keys(errors)
  if (invalid.length > 0) {
    for (const name of invalid) {
      form.elements.namedItem(name).setAttribute('aria-invalid', 'true')
      root.querySelector(`#profile-${name}-error`).textContent = ADOPTANTE_ERROR_MESSAGES[name]
    }
    say('Revisa los campos marcados antes de guardar.')
    form.elements.namedItem(invalid[0]).focus()
    return
  }
  const result = await saveProfile(adoptanteId, values)
  if (!result.ok) {
    say(result.message)
    return
  }
  adoptante = result.adoptante
  renderProfile()
  say('Perfil actualizado correctamente.')
  showForm(false)
})

async function init() {
  if (!adoptanteId) {
    feedback.innerHTML = 'Aún no tienes un perfil de adoptante. <a href="./HU09.html">Regístrate primero</a>.'
    return
  }
  say('Cargando tu perfil…')
  const result = await loadProfile(adoptanteId)
  if (!result.ok) {
    say(result.message)
    return
  }
  adoptante = result.adoptante
  renderProfile()
  say('')
  view.hidden = false
}

init()
