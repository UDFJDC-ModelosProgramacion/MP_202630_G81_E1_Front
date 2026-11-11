import { escapeHtml } from '../api/client.js'
import { getAdoptante, listAdoptantes } from '../workflows/HU11.js'
import { mountAdminPage } from '../story-admin-page.js'

const root = mountAdminPage({
  storyId: 'HU11', eyebrow: 'PANEL DEL REFUGIO', title: 'Adoptantes registrados',
  description: 'Consulta quiénes se han registrado para hacer seguimiento a los procesos de adopción.',
  sidebar: {
    sidebarLabel: 'Ayuda para el listado de adoptantes', petStatus: 'Panel del refugio', petEmoji: '👥',
    petTitle: 'Comunidad adoptante', petTag: 'HU11', petSubtitle: 'Seguimiento de adopciones',
    asideDescription: 'El listado se ordena por nombre y permite abrir el detalle de cada persona.',
    helpTitle: 'Cómo usarlo',
    helpDescription: 'Pulsa «Ver detalle» para consultar los datos de contacto de un adoptante.',
    helpLink: { href: './HU09.html', label: 'Registrar un adoptante' },
    asideNote: 'Cada adoptante es una nueva oportunidad para una mascota.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU11 · ADOPTANTES</p><h2>Listado de adoptantes</h2><p>Personas registradas en la plataforma.</p></div></div>
    <p id="adoptantes-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <div class="admin-split">
      <section class="admin-recent"><h3>Adoptantes</h3><ul id="adoptantes-list" class="admin-record-list"></ul></section>
      <section id="adoptante-detail" class="admin-recent" aria-live="polite" hidden></section>
    </div>
  `,
})

const feedback = root.querySelector('#adoptantes-feedback')
const list = root.querySelector('#adoptantes-list')
const detail = root.querySelector('#adoptante-detail')

list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]')
  if (!button) return
  const result = await getAdoptante(button.dataset.id)
  if (!result.ok) {
    feedback.textContent = result.message
    return
  }
  const { nombre, email, telefono, ciudad, direccion } = result.adoptante
  feedback.textContent = ''
  detail.innerHTML = `<h3>${escapeHtml(nombre)}</h3><ul class="admin-record-list">${[
    ['Correo', email], ['Teléfono', telefono], ['Ciudad', ciudad], ['Dirección', direccion],
  ].map(([label, value]) => `<li class="admin-record"><div class="admin-record-copy"><strong>${label}</strong><small>${escapeHtml(value)}</small></div></li>`).join('')}</ul>`
  detail.hidden = false
})

async function init() {
  feedback.textContent = 'Cargando adoptantes…'
  const result = await listAdoptantes()
  if (!result.ok) {
    feedback.textContent = result.message
    return
  }
  feedback.textContent = ''
  list.innerHTML = result.adoptantes.length ? result.adoptantes.map((adoptante) => `
    <li class="admin-record"><div class="admin-record-copy"><strong>${escapeHtml(adoptante.nombre)}</strong><small>${escapeHtml(adoptante.email)} · ${escapeHtml(adoptante.ciudad)}</small></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-id="${adoptante.id}" aria-label="Ver detalle de ${escapeHtml(adoptante.nombre)}">Ver detalle</button></div></li>
  `).join('') : '<li class="admin-empty">Aún no hay adoptantes registrados.</li>'
}

init()
