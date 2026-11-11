import { escapeHtml } from '../api/client.js'
import { listVacunas } from '../workflows/HU12.js'
import { createVacuna, deleteVacuna, updateVacuna, validateVacuna } from '../workflows/HU13.js'
import { mountAdminPage } from '../story-admin-page.js'

const root = mountAdminPage({
  storyId: 'HU13', eyebrow: 'PANEL DEL REFUGIO', title: 'Gestionar vacunas',
  description: 'Crea, edita y elimina las vacunas del catálogo para mantener la información al día.',
  sidebar: {
    sidebarLabel: 'Ayuda para gestionar vacunas', petStatus: 'Panel del refugio', petEmoji: '🩺',
    petTitle: 'Catálogo de vacunas', petTag: 'HU13', petSubtitle: 'Gestión del refugio',
    asideDescription: 'Cada vacuna necesita un nombre único. Antes de eliminar una vacuna se pide confirmación.',
    helpTitle: 'Antes de guardar',
    helpDescription: 'Si la operación no puede completarse, verás el motivo en el aviso superior.',
    helpLink: { href: './HU12.html', label: 'Ver catálogo de vacunas' },
    asideNote: 'Un catálogo claro facilita el cuidado de cada mascota.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU13 · VACUNAS</p><h2 id="vacuna-form-title">Nueva vacuna</h2><p>Registra o actualiza vacunas del catálogo.</p></div></div>
    <p id="vacuna-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <div id="vacuna-confirm" class="admin-feedback" role="alertdialog" aria-label="Confirmar eliminación" hidden>
      <span id="vacuna-confirm-text"></span>
      <div class="admin-actions"><button id="vacuna-confirm-yes" class="danger-button" type="button">Sí, eliminar</button><button id="vacuna-confirm-no" class="secondary-button" type="button">Cancelar</button></div>
    </div>
    <div class="admin-split">
      <form id="vacuna-form" class="admin-form" novalidate>
        <div class="field"><label for="vacuna-nombre">Nombre <span aria-hidden="true">*</span></label><input id="vacuna-nombre" name="nombre" required placeholder="Ej. Rabia"><small class="field-error" id="vacuna-nombre-error"></small></div>
        <div class="field"><label for="vacuna-descripcion">Descripción <span class="optional-label">(opcional)</span></label><textarea id="vacuna-descripcion" name="descripcion" rows="4" placeholder="Para qué sirve y cada cuánto se aplica..."></textarea></div>
        <div class="admin-actions"><button id="vacuna-submit" class="submit-button" type="submit">Crear vacuna <span aria-hidden="true">→</span></button><button id="vacuna-cancel" class="secondary-button" type="button" hidden>Cancelar edición</button></div>
      </form>
      <section class="admin-recent"><h3>Vacunas</h3><ul id="vacunas-list" class="admin-record-list"></ul></section>
    </div>
  `,
})

const form = root.querySelector('#vacuna-form')
const feedback = root.querySelector('#vacuna-feedback')
const list = root.querySelector('#vacunas-list')
const confirmBox = root.querySelector('#vacuna-confirm')
let vacunas = []
let editingId = null
let pendingDelete = null

function say(message) { feedback.textContent = message }

function resetForm() {
  form.reset()
  editingId = null
  root.querySelector('#vacuna-form-title').textContent = 'Nueva vacuna'
  root.querySelector('#vacuna-submit').firstChild.textContent = 'Crear vacuna '
  root.querySelector('#vacuna-cancel').hidden = true
  root.querySelector('#vacuna-nombre-error').textContent = ''
  form.elements.namedItem('nombre').removeAttribute('aria-invalid')
}

function renderList() {
  list.innerHTML = vacunas.length ? vacunas.map((vacuna) => `
    <li class="admin-record"><div class="admin-record-copy"><strong>${escapeHtml(vacuna.nombre)}</strong><small>${escapeHtml(vacuna.descripcion || 'Sin descripción')}</small></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-action="edit" data-id="${vacuna.id}" aria-label="Editar ${escapeHtml(vacuna.nombre)}">Editar</button><button class="danger-button" type="button" data-action="delete" data-id="${vacuna.id}" aria-label="Eliminar ${escapeHtml(vacuna.nombre)}">Eliminar</button></div></li>
  `).join('') : '<li class="admin-empty">Aún no hay vacunas registradas.</li>'
}

async function refresh() {
  const result = await listVacunas()
  if (!result.ok) {
    say(result.message)
    return
  }
  vacunas = result.vacunas
  renderList()
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const values = Object.fromEntries(new FormData(form).entries())
  const errors = validateVacuna(values)
  if (errors.nombre) {
    form.elements.namedItem('nombre').setAttribute('aria-invalid', 'true')
    root.querySelector('#vacuna-nombre-error').textContent = errors.nombre
    say('Revisa los campos marcados antes de guardar.')
    return
  }
  const result = editingId === null ? await createVacuna(values) : await updateVacuna(editingId, values)
  if (!result.ok) {
    say(result.message)
    return
  }
  say(editingId === null ? 'Vacuna creada correctamente.' : 'Vacuna actualizada correctamente.')
  resetForm()
  await refresh()
})

root.querySelector('#vacuna-cancel').addEventListener('click', () => {
  resetForm()
  say('Edición cancelada.')
})

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  const vacuna = vacunas.find((item) => String(item.id) === button.dataset.id)
  if (button.dataset.action === 'edit') {
    editingId = vacuna.id
    form.elements.namedItem('nombre').value = vacuna.nombre
    form.elements.namedItem('descripcion').value = vacuna.descripcion ?? ''
    root.querySelector('#vacuna-form-title').textContent = 'Editar vacuna'
    root.querySelector('#vacuna-submit').firstChild.textContent = 'Guardar cambios '
    root.querySelector('#vacuna-cancel').hidden = false
    form.elements.namedItem('nombre').focus()
    return
  }
  pendingDelete = vacuna
  root.querySelector('#vacuna-confirm-text').textContent = `¿Eliminar la vacuna ${vacuna.nombre}? Esta acción no se puede deshacer.`
  confirmBox.hidden = false
})

root.querySelector('#vacuna-confirm-no').addEventListener('click', () => {
  pendingDelete = null
  confirmBox.hidden = true
})

root.querySelector('#vacuna-confirm-yes').addEventListener('click', async () => {
  const vacuna = pendingDelete
  pendingDelete = null
  confirmBox.hidden = true
  const result = await deleteVacuna(vacuna.id)
  if (!result.ok) {
    say(result.message)
    return
  }
  if (editingId === vacuna.id) resetForm()
  say('Vacuna eliminada correctamente.')
  await refresh()
})

say('Cargando vacunas…')
refresh().then(() => { if (feedback.textContent === 'Cargando vacunas…') say('') })
