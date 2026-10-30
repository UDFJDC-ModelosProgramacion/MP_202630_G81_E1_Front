import { pets } from '../gallery.js'
import {
  createEvent,
  EVENTS_STORAGE_KEY,
  EVENT_TYPES,
  getEvents,
  saveEvent,
  updateEvent,
  validateEvent,
} from '../workflows/HU03.js'
import { mountAdminPage } from '../story-admin-page.js'

const root = mountAdminPage({
  storyId: 'HU03', eyebrow: 'HISTORIAL DEL REFUGIO', title: 'Registrar evento de vida',
  description: 'Documenta los momentos importantes en la historia de cada mascota.',
  sidebar: {
    sidebarLabel: 'Ayuda para registrar eventos', petStatus: 'Panel del refugio', petEmoji: '📋',
    petTitle: 'Historial completo', petTag: 'HU03', petSubtitle: 'Eventos de vida',
    asideDescription: 'Cada registro conserva la trayectoria de desarrollo y cuidado de la mascota.',
    helpTitle: 'Fechas y tipos permitidos',
    helpDescription: 'Registra eventos pasados con una fecha válida y un tipo reconocido.',
    helpLink: { href: './HU04.html', label: 'Consultar línea de tiempo' },
    asideNote: 'Un historial claro ayuda a dar continuidad al cuidado.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU03 · EVENTO DE VIDA</p><h2 id="event-form-title">Nuevo evento</h2><p>El evento aparecerá en el historial cronológico de la mascota.</p></div></div>
    <p id="event-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <form id="event-form" class="admin-form" novalidate>
      <input id="event-id" type="hidden">
      <div class="field"><label for="event-pet">Mascota <span aria-hidden="true">*</span></label><select id="event-pet" name="petId" required><option value="">Selecciona una mascota</option>${pets.map((pet) => `<option value="${pet.id}">${pet.name}</option>`).join('')}</select><small class="field-error" id="event-pet-error"></small></div>
      <div class="field"><label for="event-type">Tipo de evento <span aria-hidden="true">*</span></label><select id="event-type" name="type" required><option value="">Selecciona un tipo</option>${EVENT_TYPES.map((type) => `<option>${type}</option>`).join('')}</select><small class="field-error" id="event-type-error"></small></div>
      <div class="field"><label for="event-date">Fecha del evento <span aria-hidden="true">*</span></label><input id="event-date" name="date" type="date" required><small class="field-error" id="event-date-error"></small></div>
      <div class="field"><label for="event-description">Descripción <span aria-hidden="true">*</span></label><textarea id="event-description" name="description" rows="4" required placeholder="Describe el evento..."></textarea><small class="field-error" id="event-description-error"></small></div>
      <div class="admin-actions"><button class="submit-button" type="submit">Guardar evento <span aria-hidden="true">→</span></button><button id="event-cancel" class="secondary-button" type="button" hidden>Cancelar</button></div>
    </form>
    <section class="admin-recent"><h3>Eventos recientes</h3><ul id="event-list" class="admin-record-list"></ul></section>
  `,
})

const form = root.querySelector('#event-form')
const idInput = root.querySelector('#event-id')
const petInput = root.querySelector('#event-pet')
const typeInput = root.querySelector('#event-type')
const dateInput = root.querySelector('#event-date')
const descriptionInput = root.querySelector('#event-description')
const feedback = root.querySelector('#event-feedback')
const list = root.querySelector('#event-list')
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

function renderEvents() {
  const events = getEvents(window.localStorage).sort((a, b) => b.date.localeCompare(a.date))
  list.innerHTML = events.length ? events.map((event) => `
    <li class="admin-record event-record"><div class="admin-record-copy"><span class="record-badge">${escape(event.type)}</span><strong>${escape(event.petName)} · ${escape(event.date)}</strong><small>${escape(event.description)}</small></div><button class="secondary-button" type="button" data-edit="${escape(event.id)}">Editar</button></li>
  `).join('') : '<li class="admin-empty">Aún no hay eventos registrados.</li>'
}

function resetForm() {
  form.reset()
  idInput.value = ''
  root.querySelector('#event-form-title').textContent = 'Nuevo evento'
  root.querySelector('#event-cancel').hidden = true
}

root.querySelector('#event-cancel').addEventListener('click', resetForm)
list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit]')
  if (!button) return
  const record = getEvents(window.localStorage).find((item) => item.id === button.dataset.edit)
  if (!record) return
  idInput.value = record.id
  petInput.value = record.petId
  typeInput.value = record.type
  dateInput.value = record.date
  descriptionInput.value = record.description
  root.querySelector('#event-form-title').textContent = 'Editar evento'
  root.querySelector('#event-cancel').hidden = false
  petInput.focus()
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const values = { petId: petInput.value, type: typeInput.value, date: dateInput.value, description: descriptionInput.value }
  const errors = validateEvent(values)
  for (const [field, errorId] of Object.entries({
    petId: 'event-pet-error',
    type: 'event-type-error',
    date: 'event-date-error',
    description: 'event-description-error',
  })) {
    root.querySelector(`#${errorId}`).textContent = errors[field] ?? ''
  }
  if (Object.keys(errors).length) {
    feedback.textContent = Object.values(errors)[0]
    return
  }
  try {
    if (idInput.value) updateEvent(window.localStorage, idInput.value, values)
    else saveEvent(window.localStorage, createEvent(values))
    feedback.textContent = 'Evento guardado.'
    resetForm()
    renderEvents()
  } catch (error) {
    feedback.textContent = error.message
  }
})

renderEvents()