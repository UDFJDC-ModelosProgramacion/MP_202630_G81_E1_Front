import { mountAdminPage } from '../story-admin-page.js'
import { ADOPTANTE_STORAGE_KEY } from '../workflows/HU09.js'
import { getApiUrl } from '../api/client.js'
import { deleteAdopterMessage, listAdopterMessages, setAdopterMessageRead } from '../workflows/story-api.js'

const API_OPTIONS = { apiUrl: getApiUrl(import.meta.env), fetchFn: window.fetch.bind(window) }
let adopterId = ''
let messages = []

const root = mountAdminPage({
  storyId: 'HU08', eyebrow: 'ORGANIZA TU BANDEJA', title: 'Organizar mensajes',
  description: 'Marca tus mensajes como leídos o no leídos para mantener tu bandeja en orden.',
  sidebar: {
    sidebarLabel: 'Ayuda para organizar mensajes', petStatus: 'Bandeja personal', petEmoji: '✓',
    petTitle: 'Todo en orden', petTag: 'HU08', petSubtitle: 'Estado de mensajes',
    asideDescription: 'El estado de lectura se guarda por mensaje en tu bandeja personal.',
    helpTitle: 'Solo tus mensajes',
    helpDescription: 'Las acciones de organización se aplican exclusivamente a mensajes de tu adoptante.',
    helpLink: { href: './HU07.html', label: 'Volver a mensajes' },
    asideNote: 'Los mensajes leídos no se pueden eliminar.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU08 · ORGANIZAR BANDEJA</p><h2>Organizar mensajes</h2><p>Marca tus mensajes como leídos o no leídos.</p></div></div>
    <p id="organize-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <div class="admin-actions message-bulk-actions"><span>Acciones:</span><button id="mark-selected-read" class="secondary-button" type="button">Marcar como leído</button><button id="mark-selected-unread" class="secondary-button" type="button">Marcar como no leído</button></div>
    <ul id="organize-list" class="admin-record-list" aria-label="Mensajes para organizar"></ul>
  `,
})

const list = root.querySelector('#organize-list')
const feedback = root.querySelector('#organize-feedback')
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

function renderMessages() {
  list.innerHTML = messages.length ? messages.map((message) => `
    <li class="admin-record message-record"><label class="message-select-label"><input class="message-select" type="checkbox" value="${escape(message.id)}" aria-label="Seleccionar ${escape(message.subject)}"></label><div class="admin-record-copy"><strong>${escape(message.subject)}</strong><small>${escape(message.petName)} · ${escape(message.createdAt.slice(0, 10))}</small><span class="record-badge ${message.read ? 'message-read' : ''}">${message.read ? 'Leído' : 'No leído'}</span></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-action="toggle" data-id="${escape(message.id)}">${message.read ? 'Marcar como no leído' : 'Marcar como leído'}</button><button class="secondary-button danger-button" type="button" data-action="delete" data-id="${escape(message.id)}" ${message.read ? 'disabled title="Los mensajes leídos no se pueden eliminar."' : ''}>Eliminar</button></div></li>
  `).join('') : '<li class="admin-empty">No tienes mensajes para organizar.</li>'
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

function selectedIds() {
  return Array.from(list.querySelectorAll('.message-select:checked'), (checkbox) => checkbox.value)
}

async function updateSelected(read) {
  const ids = selectedIds()
  if (!ids.length) {
    feedback.textContent = 'Selecciona al menos un mensaje.'
    return
  }
  try {
    const results = await Promise.all(ids.map((id) => setAdopterMessageRead(adopterId, id, read, API_OPTIONS)))
    const failed = results.find((result) => !result.ok)
    if (failed) throw new Error(failed.message)
    feedback.textContent = read ? 'Mensajes marcados como leídos.' : 'Mensajes marcados como no leídos.'
    if (await loadMessages()) feedback.textContent = read ? 'Mensajes marcados como leídos.' : 'Mensajes marcados como no leídos.'
  } catch (error) {
    feedback.textContent = error.message
  }
}

root.querySelector('#mark-selected-read').addEventListener('click', () => updateSelected(true))
root.querySelector('#mark-selected-unread').addEventListener('click', () => updateSelected(false))
list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  try {
    const { action, id } = button.dataset
    if (action === 'toggle') {
      const current = messages.find((message) => String(message.id) === id)
      if (!current) throw new Error('No encontramos el mensaje seleccionado.')
      const result = await setAdopterMessageRead(adopterId, id, !current.read, API_OPTIONS)
      if (!result.ok) throw new Error(result.message)
      if (await loadMessages()) feedback.textContent = 'Estado del mensaje actualizado.'
    } else {
      const result = await deleteAdopterMessage(adopterId, id, API_OPTIONS)
      if (!result.ok) throw new Error(result.message)
      if (await loadMessages()) feedback.textContent = 'Mensaje eliminado.'
    }
  } catch (error) {
    feedback.textContent = error.message
  }
})

async function initialize() {
  adopterId = window.localStorage.getItem(ADOPTANTE_STORAGE_KEY) || ''
  if (!/^\d+$/.test(adopterId) || Number(adopterId) <= 0) {
    feedback.textContent = 'Regístrate como adoptante en HU09 para consultar y organizar mensajes.'
    list.innerHTML = '<li class="admin-empty">No hay una sesión de adoptante asociada a este navegador.</li>'
    root.querySelectorAll('.message-bulk-actions button').forEach((button) => { button.disabled = true })
    return
  }
  await loadMessages()
}

initialize()