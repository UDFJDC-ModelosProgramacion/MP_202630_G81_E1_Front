import { escapeHtml, toDateOnly } from '../api/client.js'
import { validateVaccination, listMascotas } from '../workflows/HU14.js'
import { getVaccinationHistory } from '../workflows/HU15.js'
import { deleteVaccination, toEditValues, updateVaccination } from '../workflows/HU16.js'
import { mountAdminPage } from '../story-admin-page.js'

const today = new Date().toISOString().slice(0, 10)

const root = mountAdminPage({
  storyId: 'HU16', eyebrow: 'PANEL DEL REFUGIO', title: 'Corregir vacunación',
  description: 'Edita o elimina registros de vacunación para evitar datos erróneos en el historial.',
  sidebar: {
    sidebarLabel: 'Ayuda para corregir vacunación', petStatus: 'Panel del refugio', petEmoji: '✏️',
    petTitle: 'Historial confiable', petTag: 'HU16', petSubtitle: 'Corrección de registros',
    asideDescription: 'Los cambios se reflejan de inmediato en el historial de la mascota.',
    helpTitle: 'Antes de eliminar',
    helpDescription: 'Eliminar un registro pide confirmación y no se puede deshacer.',
    helpLink: { href: './HU14.html', label: 'Registrar una vacunación' },
    asideNote: 'Un historial correcto protege a cada mascota.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU16 · VACUNACIÓN</p><h2>Registros de vacunación</h2><p>Elige una mascota y corrige sus registros.</p></div></div>
    <div class="field admin-pet-filter"><label for="edit-mascota">Mascota</label><select id="edit-mascota"><option value="">Selecciona una mascota</option></select></div>
    <p id="edit-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <div id="edit-confirm" class="admin-feedback" role="alertdialog" aria-label="Confirmar eliminación" hidden>
      <span id="edit-confirm-text"></span>
      <div class="admin-actions"><button id="edit-confirm-yes" class="danger-button" type="button">Sí, eliminar</button><button id="edit-confirm-no" class="secondary-button" type="button">Cancelar</button></div>
    </div>
    <div class="admin-split">
      <section class="admin-recent"><h3>Registros</h3><ul id="edit-list" class="admin-record-list"></ul></section>
      <form id="edit-form" class="admin-form" novalidate hidden>
        <h3 id="edit-form-title">Editar registro</h3>
        <div class="field"><label for="edit-fechaAplicacion">Fecha de aplicación <span aria-hidden="true">*</span></label><input id="edit-fechaAplicacion" name="fechaAplicacion" type="date" max="${today}" required><small class="field-error" id="edit-fechaAplicacion-error"></small></div>
        <div class="field"><label for="edit-proximaFecha">Próxima fecha <span class="optional-label">(opcional)</span></label><input id="edit-proximaFecha" name="proximaFecha" type="date"><small class="field-error" id="edit-proximaFecha-error"></small></div>
        <div class="field"><label for="edit-numeroLote">Número de lote <span aria-hidden="true">*</span></label><input id="edit-numeroLote" name="numeroLote" required><small class="field-error" id="edit-numeroLote-error"></small></div>
        <div class="field"><label for="edit-observacion">Observaciones <span class="optional-label">(opcional)</span></label><textarea id="edit-observacion" name="observacion" rows="3"></textarea></div>
        <div class="admin-actions"><button class="submit-button" type="submit">Guardar cambios</button><button id="edit-cancel" class="secondary-button" type="button">Cancelar</button></div>
      </form>
    </div>
  `,
})

const select = root.querySelector('#edit-mascota')
const feedback = root.querySelector('#edit-feedback')
const list = root.querySelector('#edit-list')
const form = root.querySelector('#edit-form')
const confirmBox = root.querySelector('#edit-confirm')
const NAMES = ['fechaAplicacion', 'proximaFecha', 'numeroLote']
let registros = []
let editing = null
let pendingDelete = null

function say(message) { feedback.textContent = message }

function closeForm() {
  editing = null
  form.hidden = true
  for (const name of NAMES) {
    form.elements.namedItem(name).removeAttribute('aria-invalid')
    root.querySelector(`#edit-${name}-error`).textContent = ''
  }
}

function renderList() {
  list.innerHTML = registros.length ? registros.map((registro) => `
    <li class="admin-record"><div class="admin-record-copy"><strong>${escapeHtml(registro.vacuna?.nombre ?? 'Vacuna')}</strong><small>Aplicada el ${escapeHtml(toDateOnly(registro.fechaAplicacion))} · Lote ${escapeHtml(registro.numeroLote)}</small></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-action="edit" data-id="${registro.id}" aria-label="Editar vacunación ${escapeHtml(registro.vacuna?.nombre ?? '')} del ${escapeHtml(toDateOnly(registro.fechaAplicacion))}">Editar</button><button class="danger-button" type="button" data-action="delete" data-id="${registro.id}" aria-label="Eliminar vacunación ${escapeHtml(registro.vacuna?.nombre ?? '')} del ${escapeHtml(toDateOnly(registro.fechaAplicacion))}">Eliminar</button></div></li>
  `).join('') : '<li class="admin-empty">Esta mascota aún no tiene registros de vacunación.</li>'
}

async function loadRecords() {
  closeForm()
  if (!select.value) {
    registros = []
    list.replaceChildren()
    return
  }
  const result = await getVaccinationHistory(select.value)
  if (!result.ok) {
    say(result.message)
    return
  }
  registros = result.registros
  renderList()
}

select.addEventListener('change', () => { say(''); loadRecords() })

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  const registro = registros.find((item) => String(item.id) === button.dataset.id)
  if (button.dataset.action === 'edit') {
    editing = registro
    const values = toEditValues(registro)
    for (const name of [...NAMES, 'observacion']) form.elements.namedItem(name).value = values[name]
    form.hidden = false
    form.elements.namedItem('fechaAplicacion').focus()
    return
  }
  pendingDelete = registro
  root.querySelector('#edit-confirm-text').textContent = `¿Eliminar el registro de ${registro.vacuna?.nombre ?? 'vacuna'} del ${toDateOnly(registro.fechaAplicacion)}? Esta acción no se puede deshacer.`
  confirmBox.hidden = false
})

root.querySelector('#edit-cancel').addEventListener('click', () => { closeForm(); say('Edición cancelada.') })
root.querySelector('#edit-confirm-no').addEventListener('click', () => { pendingDelete = null; confirmBox.hidden = true })

root.querySelector('#edit-confirm-yes').addEventListener('click', async () => {
  const registro = pendingDelete
  pendingDelete = null
  confirmBox.hidden = true
  const result = await deleteVaccination(registro.id)
  if (!result.ok) {
    say(result.message)
    return
  }
  say('Registro eliminado correctamente.')
  await loadRecords()
})

form.addEventListener('input', (event) => {
  event.target.removeAttribute('aria-invalid')
  const error = root.querySelector(`#edit-${event.target.name}-error`)
  if (error) error.textContent = ''
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const values = { ...toEditValues(editing), ...Object.fromEntries(new FormData(form).entries()) }
  const errors = validateVaccination(values, today)
  const invalid = Object.keys(errors)
  if (invalid.length > 0) {
    for (const name of invalid) {
      form.elements.namedItem(name).setAttribute('aria-invalid', 'true')
      root.querySelector(`#edit-${name}-error`).textContent = errors[name]
    }
    say('Revisa los campos marcados antes de guardar.')
    form.elements.namedItem(invalid[0]).focus()
    return
  }
  const result = await updateVaccination(editing.id, values)
  if (!result.ok) {
    say(result.message)
    return
  }
  say('Registro actualizado correctamente.')
  await loadRecords()
})

async function init() {
  const result = await listMascotas()
  if (!result.ok) {
    say(result.message)
    return
  }
  select.insertAdjacentHTML('beforeend', result.mascotas.map((mascota) => `<option value="${mascota.id}">${escapeHtml(mascota.nombre)}</option>`).join(''))
}

init()
