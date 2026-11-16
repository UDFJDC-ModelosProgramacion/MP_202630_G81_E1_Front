import { mountAdminPage } from '../story-admin-page.js'
import { CURRENT_ADOPTER_ID, deleteMessage, getAdopterMessages } from '../workflows/HU07.js'
import { setMessagesReadStatus, setMessageReadStatus } from '../workflows/HU08.js'

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
  const messages = getAdopterMessages(window.localStorage, CURRENT_ADOPTER_ID)
  list.innerHTML = messages.length ? messages.map((message) => `
    <li class="admin-record message-record"><label class="message-select-label"><input class="message-select" type="checkbox" value="${escape(message.id)}" aria-label="Seleccionar ${escape(message.subject)}"></label><div class="admin-record-copy"><strong>${escape(message.subject)}</strong><small>${escape(message.petName)} · ${escape(message.createdAt.slice(0, 10))}</small><span class="record-badge ${message.read ? 'message-read' : ''}">${message.read ? 'Leído' : 'No leído'}</span></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-action="toggle" data-id="${escape(message.id)}">${message.read ? 'Marcar como no leído' : 'Marcar como leído'}</button><button class="secondary-button danger-button" type="button" data-action="delete" data-id="${escape(message.id)}">Eliminar</button></div></li>
  `).join('') : '<li class="admin-empty">No tienes mensajes para organizar.</li>'
}

function selectedIds() {
  return Array.from(list.querySelectorAll('.message-select:checked'), (checkbox) => checkbox.value)
}

function updateSelected(read) {
  const ids = selectedIds()
  if (!ids.length) {
    feedback.textContent = 'Selecciona al menos un mensaje.'
    return
  }
  try {
    setMessagesReadStatus(window.localStorage, ids, CURRENT_ADOPTER_ID, read)
    feedback.textContent = read ? 'Mensajes marcados como leídos.' : 'Mensajes marcados como no leídos.'
    renderMessages()
  } catch (error) {
    feedback.textContent = error.message
  }
}

root.querySelector('#mark-selected-read').addEventListener('click', () => updateSelected(true))
root.querySelector('#mark-selected-unread').addEventListener('click', () => updateSelected(false))
list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  try {
    const { action, id } = button.dataset
    if (action === 'toggle') {
      const current = getAdopterMessages(window.localStorage, CURRENT_ADOPTER_ID).find((message) => message.id === id)
      setMessageReadStatus(window.localStorage, id, CURRENT_ADOPTER_ID, !current.read)
      feedback.textContent = 'Estado del mensaje actualizado.'
    } else {
      deleteMessage(window.localStorage, id, CURRENT_ADOPTER_ID)
      feedback.textContent = 'Mensaje eliminado.'
    }
    renderMessages()
  } catch (error) {
    feedback.textContent = error.message
  }
})

renderMessages()