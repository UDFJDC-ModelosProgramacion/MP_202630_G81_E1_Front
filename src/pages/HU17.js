import { escapeHtml, toDateOnly } from '../api/client.js'
import { getStoredAdoptanteId } from '../workflows/HU09.js'
import { getNotifications } from '../workflows/HU17.js'
import { mountAdminPage } from '../story-admin-page.js'

const root = mountAdminPage({
  storyId: 'HU17', eyebrow: 'MI CUENTA', title: 'Mis notificaciones',
  description: 'Entérate del estado de tus solicitudes y de las vacunas de tu mascota.',
  sidebar: {
    sidebarLabel: 'Ayuda para las notificaciones', petStatus: 'Bandeja del adoptante', petEmoji: '🔔',
    petTitle: 'Todo al día', petTag: 'HU17', petSubtitle: 'Avisos del refugio',
    asideDescription: 'Solo ves las notificaciones que pertenecen a tu cuenta, de la más reciente a la más antigua.',
    helpTitle: 'Cómo usarlo',
    helpDescription: 'Cada aviso indica el mensaje, la fecha y el canal por el que se envió.',
    helpLink: { href: './HU10.html', label: 'Consultar mi perfil' },
    asideNote: 'Los avisos te ayudan a no olvidar nada importante.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU17 · NOTIFICACIONES</p><h2>Bandeja de notificaciones</h2><p>De la más reciente a la más antigua.</p></div></div>
    <p id="notifications-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <ul id="notifications-list" class="admin-record-list" aria-label="Notificaciones"></ul>
  `,
})

const feedback = root.querySelector('#notifications-feedback')
const list = root.querySelector('#notifications-list')

async function init() {
  const adoptanteId = getStoredAdoptanteId(window.localStorage)
  if (!adoptanteId) {
    feedback.innerHTML = 'Aún no tienes un perfil de adoptante. <a href="./HU09.html">Regístrate primero</a>.'
    return
  }
  feedback.textContent = 'Cargando notificaciones…'
  const result = await getNotifications(adoptanteId)
  if (!result.ok) {
    feedback.textContent = result.message
    return
  }
  feedback.textContent = result.notificaciones.length ? '' : 'No tienes notificaciones por ahora.'
  list.innerHTML = result.notificaciones.map((notificacion) => `
    <li class="admin-record"><div class="admin-record-copy"><strong>${escapeHtml(notificacion.mensaje)}</strong><small>${escapeHtml(toDateOnly(notificacion.fecha) || 'Sin fecha')} · Canal: ${escapeHtml(notificacion.canal)}</small></div><span class="record-badge">${escapeHtml(notificacion.tipo ?? 'Aviso')}</span></li>
  `).join('')
}

init()
