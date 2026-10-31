import { escapeHtml } from '../api/client.js'
import { listVacunas } from '../workflows/HU12.js'
import { createVaccination, listMascotas, validateVaccination } from '../workflows/HU14.js'
import { mountAdminPage } from '../story-admin-page.js'

const today = new Date().toISOString().slice(0, 10)

const root = mountAdminPage({
  storyId: 'HU14', eyebrow: 'PANEL DEL REFUGIO', title: 'Registrar vacunación',
  description: 'Anota las vacunas aplicadas a una mascota para llevar el control de su historial.',
  sidebar: {
    sidebarLabel: 'Ayuda para registrar vacunación', petStatus: 'Panel del refugio', petEmoji: '💉',
    petTitle: 'Control de vacunación', petTag: 'HU14', petSubtitle: 'Historial de salud',
    asideDescription: 'El registro queda asociado a la mascota y aparece en su historial de vacunación.',
    helpTitle: 'Antes de registrar',
    helpDescription: 'Elige la mascota y la vacuna, indica la fecha de aplicación y el número de lote.',
    helpLink: { href: './HU15.html', label: 'Consultar historial de vacunación' },
    asideNote: 'Un buen registro cuida la salud de cada mascota.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU14 · VACUNACIÓN</p><h2>Nuevo registro de vacunación</h2><p>Completa los datos de la aplicación.</p></div></div>
    <p id="vaccination-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <form id="vaccination-form" class="admin-form" novalidate>
      <div class="field"><label for="vaccination-mascotaId">Mascota <span aria-hidden="true">*</span></label><select id="vaccination-mascotaId" name="mascotaId" required><option value="">Selecciona una mascota</option></select><small class="field-error" id="vaccination-mascotaId-error"></small></div>
      <div class="field"><label for="vaccination-vacunaId">Vacuna <span aria-hidden="true">*</span></label><select id="vaccination-vacunaId" name="vacunaId" required><option value="">Selecciona una vacuna</option></select><small class="field-error" id="vaccination-vacunaId-error"></small></div>
      <div class="field"><label for="vaccination-fechaAplicacion">Fecha de aplicación <span aria-hidden="true">*</span></label><input id="vaccination-fechaAplicacion" name="fechaAplicacion" type="date" max="${today}" required><small class="field-error" id="vaccination-fechaAplicacion-error"></small></div>
      <div class="field"><label for="vaccination-proximaFecha">Próxima fecha <span class="optional-label">(opcional)</span></label><input id="vaccination-proximaFecha" name="proximaFecha" type="date"><small class="field-error" id="vaccination-proximaFecha-error"></small></div>
      <div class="field"><label for="vaccination-numeroLote">Número de lote <span aria-hidden="true">*</span></label><input id="vaccination-numeroLote" name="numeroLote" required placeholder="Ej. L-2045"><small class="field-error" id="vaccination-numeroLote-error"></small></div>
      <div class="field"><label for="vaccination-observacion">Observaciones <span class="optional-label">(opcional)</span></label><textarea id="vaccination-observacion" name="observacion" rows="3"></textarea></div>
      <div class="admin-actions"><button class="submit-button" type="submit">Registrar vacunación <span aria-hidden="true">→</span></button><button id="vaccination-cancel" class="secondary-button" type="button">Cancelar</button></div>
    </form>
  `,
})

const form = root.querySelector('#vaccination-form')
const feedback = root.querySelector('#vaccination-feedback')
const NAMES = ['mascotaId', 'vacunaId', 'fechaAplicacion', 'proximaFecha', 'numeroLote']

function say(message) { feedback.textContent = message }

function clearErrors() {
  for (const name of NAMES) {
    form.elements.namedItem(name).removeAttribute('aria-invalid')
    root.querySelector(`#vaccination-${name}-error`).textContent = ''
  }
}

function fillSelect(name, items) {
  form.elements.namedItem(name).insertAdjacentHTML('beforeend', items.map((item) => `<option value="${item.id}">${escapeHtml(item.nombre)}</option>`).join(''))
}

form.addEventListener('input', (event) => {
  event.target.removeAttribute('aria-invalid')
  const error = root.querySelector(`#vaccination-${event.target.name}-error`)
  if (error) error.textContent = ''
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  clearErrors()
  const values = Object.fromEntries(new FormData(form).entries())
  const errors = validateVaccination(values, today)
  const invalid = Object.keys(errors)
  if (invalid.length > 0) {
    for (const name of invalid) {
      form.elements.namedItem(name).setAttribute('aria-invalid', 'true')
      root.querySelector(`#vaccination-${name}-error`).textContent = errors[name]
    }
    say('Revisa los campos marcados antes de registrar.')
    form.elements.namedItem(invalid[0]).focus()
    return
  }
  const result = await createVaccination(values)
  if (!result.ok) {
    say(result.message)
    return
  }
  form.reset()
  say('Vacunación registrada correctamente. Ya aparece en el historial de la mascota.')
})

root.querySelector('#vaccination-cancel').addEventListener('click', () => {
  form.reset()
  clearErrors()
  say('Registro cancelado. No se guardó ningún dato.')
})

async function init() {
  say('Cargando mascotas y vacunas…')
  const [mascotas, vacunas] = await Promise.all([listMascotas(), listVacunas()])
  if (!mascotas.ok || !vacunas.ok) {
    say((mascotas.ok ? vacunas : mascotas).message)
    return
  }
  fillSelect('mascotaId', mascotas.mascotas)
  fillSelect('vacunaId', vacunas.vacunas)
  say('')
}

init()
