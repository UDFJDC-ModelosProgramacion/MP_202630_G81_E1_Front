import { mountAdminPage } from '../story-admin-page.js'
import { ADOPTANTE_STORAGE_KEY } from '../workflows/HU09.js'
import { escapeHtml, getApiUrl } from '../api/client.js'
import { createAdopterMessage, deleteAdopterMessage, listAdopterMessages, listPets, updateAdopterMessage } from '../workflows/story-api.js'

const API_OPTIONS = { apiUrl: getApiUrl(import.meta.env), fetchFn: window.fetch.bind(window) }
let pets = []
let messages = []
let adopterId = ''

const root = mountAdminPage({
  storyId: 'HU07', eyebrow: 'ACOMPAÑAMIENTO EN LA ADOPCIÓN', title: 'Mensajes',
  description: 'Comunícate con el refugio durante el proceso de adopción.',
  sidebar: {
    sidebarLabel: 'Ayuda para usar mensajes', petStatus: 'Bandeja del adoptante', petEmoji: '✉️',
    petTitle: 'En contacto', petTag: 'HU07', petSubtitle: 'Mensajes del refugio',
    asideDescription: 'Consulta tus mensajes y comunícate con el refugio sobre una mascota.',
    helpTitle: 'Mensajes no leídos',
    helpDescription: 'Puedes editar o eliminar tus mensajes mientras todavía no se hayan marcado como leídos.',
    helpLink: { href: './HU08.html', label: 'Organizar mensajes' },
    asideNote: 'La conversación ayuda a acompañar cada adopción.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU07 · BANDEJA DEL ADOPTANTE</p><h2>Mensajes</h2><p>Escribe al refugio o revisa tus conversaciones.</p></div></div>
    <p id="message-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <div class="admin-split">
      <section class="admin-recent"><h3>Bandeja</h3><div class="field admin-pet-filter"><label for="message-pet-filter">Filtrar por mascota</label><select id="message-pet-filter"><option value="">Todas las mascotas</option></select></div><ul id="message-list" class="admin-record-list" aria-label="Mensajes del adoptante"></ul></section>
      <form id="message-form" class="admin-form" novalidate>
        <h3 id="message-form-title">Nuevo mensaje</h3>
        <input id="message-id" type="hidden">
        <div class="field"><label for="message-pet">Mascota relacionada</label><select id="message-pet"><option value="">Selecciona una mascota</option></select><small class="field-error" id="message-pet-error"></small></div>
        <div class="field"><label for="message-subject">Asunto</label><input id="message-subject" required><small class="field-error" id="message-subject-error"></small></div>
        <div class="field"><label for="message-content">Contenido</label><textarea id="message-content" rows="5" required></textarea><small class="field-error" id="message-content-error"></small></div>
        <div class="admin-actions"><button class="submit-button" type="submit">Enviar mensaje</button><button id="message-cancel" class="secondary-button" type="button" hidden>Cancelar</button></div>
      </form>
    </div>
  `,
})

const form = root.querySelector('#message-form')
const list = root.querySelector('#message-list')
const feedback = root.querySelector('#message-feedback')
const petFilter = root.querySelector('#message-pet-filter')
const idInput = root.querySelector('#message-id')
const petInput = root.querySelector('#message-pet')
const subjectInput = root.querySelector('#message-subject')
const contentInput = root.querySelector('#message-content')
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

function renderMessages() {
  const filtered = messages.filter((message) => !petFilter.value || String(message.petId) === petFilter.value)
  list.innerHTML = filtered.length ? filtered.map((message) => `
    <li class="admin-record message-record"><div class="admin-record-copy"><strong>${escape(message.subject)}</strong><small>Sobre: ${escape(message.petName)} · ${escape(message.createdAt.slice(0, 10))}</small><small>${escape(message.content)}</small><span class="record-badge">${message.read ? 'Leído' : 'No leído'}</span></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-action="edit" data-id="${escape(message.id)}" ${message.read ? 'disabled title="Los mensajes leídos no se pueden editar."' : ''}>Editar</button><button class="secondary-button danger-button" type="button" data-action="delete" data-id="${escape(message.id)}" ${message.read ? 'disabled title="Los mensajes leídos no se pueden eliminar."' : ''}>Eliminar</button></div></li>
  `).join('') : '<li class="admin-empty">Aún no tienes mensajes. Envía uno al refugio.</li>'
}

async function loadMessages() {
  const result = await listAdopterMessages(adopterId, API_OPTIONS)
  if (!result.ok) {
    feedback.textContent = result.message
    messages = []
    list.innerHTML = '<li class="admin-empty">No fue posible cargar tus mensajes.</li>'
    return false
  } else {
    messages = result.messages.sort((first, second) => second.createdAt.localeCompare(first.createdAt))
  }
  renderMessages()
  return true
}

function resetForm() {
  form.reset()
  idInput.value = ''
  root.querySelector('#message-form-title').textContent = 'Nuevo mensaje'
  root.querySelector('#message-cancel').hidden = true
}

root.querySelector('#message-cancel').addEventListener('click', resetForm)
list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  try {
    const { action, id } = button.dataset
    const message = messages.find((item) => String(item.id) === id)
    if (action === 'edit' && message) {
      if (message.read) throw new Error('El mensaje ya fue leído y no puede editarse.')
      idInput.value = message.id
      petInput.value = message.petId ?? ''
      subjectInput.value = message.subject
      contentInput.value = message.content
      root.querySelector('#message-form-title').textContent = 'Editar mensaje'
      root.querySelector('#message-cancel').hidden = false
      subjectInput.focus()
      return
    }
    if (!message) throw new Error('No encontramos el mensaje seleccionado.')
    const result = await deleteAdopterMessage(adopterId, id, API_OPTIONS)
    if (!result.ok) throw new Error(result.message)
    if (await loadMessages()) feedback.textContent = 'Mensaje eliminado.'
  } catch (error) {
    feedback.textContent = error.message
  }
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const values = { petId: petInput.value, subject: subjectInput.value, content: contentInput.value, date: new Date().toISOString().slice(0, 10), read: false }
  const errors = {}
  if (!pets.some((pet) => String(pet.id) === values.petId)) errors.petId = 'Selecciona una mascota.'
  if (!values.subject.trim()) errors.subject = 'Escribe el asunto del mensaje.'
  if (!values.content.trim()) errors.content = 'Escribe el contenido del mensaje.'
  for (const [field, errorId] of Object.entries({ petId: 'message-pet-error', subject: 'message-subject-error', content: 'message-content-error' })) {
    root.querySelector(`#${errorId}`).textContent = errors[field] ?? ''
  }
  if (Object.keys(errors).length) {
    feedback.textContent = Object.values(errors)[0]
    return
  }
  try {
    const result = idInput.value
      ? await updateAdopterMessage(adopterId, idInput.value, values, API_OPTIONS)
      : await createAdopterMessage(adopterId, values, API_OPTIONS)
    if (!result.ok) throw new Error(result.message)
    const wasEditing = Boolean(idInput.value)
    resetForm()
    if (await loadMessages()) feedback.textContent = wasEditing ? 'Mensaje actualizado.' : 'Mensaje enviado.'
  } catch (error) {
    feedback.textContent = error.message
  }
})

petFilter.addEventListener('change', renderMessages)

async function initialize() {
  adopterId = window.localStorage.getItem(ADOPTANTE_STORAGE_KEY) || ''
  if (!/^\d+$/.test(adopterId) || Number(adopterId) <= 0) {
    feedback.textContent = 'Regístrate como adoptante en HU09 para consultar y enviar mensajes.'
    list.innerHTML = '<li class="admin-empty">No hay una sesión de adoptante asociada a este navegador.</li>'
    form.querySelector('button[type="submit"]').disabled = true
    return
  }
  const result = await listPets(API_OPTIONS)
  if (!result.ok) {
    feedback.textContent = result.message
    list.replaceChildren()
    return
  }
  pets = result.pets
  const options = pets.map((pet) => `<option value="${escapeHtml(pet.id)}">${escapeHtml(pet.name)}</option>`).join('')
  petInput.innerHTML = `<option value="">Selecciona una mascota</option>${options}`
  petFilter.insertAdjacentHTML('beforeend', options)
  if (pets.length) petInput.value = String(pets[0].id)
  await loadMessages()
}

initialize()