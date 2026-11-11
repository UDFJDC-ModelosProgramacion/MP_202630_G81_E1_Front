import { escapeHtml } from '../api/client.js'
import { getVacuna, listVacunas } from '../workflows/HU12.js'
import { mountAdminPage } from '../story-admin-page.js'

const root = mountAdminPage({
  storyId: 'HU12', eyebrow: 'SALUD ANIMAL', title: 'Catálogo de vacunas',
  description: 'Conoce las vacunas disponibles y cuáles necesita una mascota antes de adoptarla.',
  sidebar: {
    sidebarLabel: 'Ayuda para el catálogo de vacunas', petStatus: 'Consulta pública', petEmoji: '💉',
    petTitle: 'Vacunas al día', petTag: 'HU12', petSubtitle: 'Prevención y cuidado',
    asideDescription: 'El catálogo es de solo lectura: el refugio mantiene la información actualizada.',
    helpTitle: 'Cómo usarlo',
    helpDescription: 'Pulsa «Ver detalle» para leer la descripción completa de una vacuna.',
    helpLink: { href: './HU15.html', label: 'Consultar historial de vacunación' },
    asideNote: 'Una mascota vacunada es una mascota protegida.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU12 · VACUNAS</p><h2>Vacunas disponibles</h2><p>Catálogo de consulta.</p></div></div>
    <p id="vacunas-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <div class="admin-split">
      <section class="admin-recent"><h3>Catálogo</h3><ul id="vacunas-list" class="admin-record-list"></ul></section>
      <section id="vacuna-detail" class="admin-recent" aria-live="polite" hidden></section>
    </div>
  `,
})

const feedback = root.querySelector('#vacunas-feedback')
const list = root.querySelector('#vacunas-list')
const detail = root.querySelector('#vacuna-detail')

list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]')
  if (!button) return
  const result = await getVacuna(button.dataset.id)
  if (!result.ok) {
    feedback.textContent = result.message
    return
  }
  feedback.textContent = ''
  detail.innerHTML = `<h3>${escapeHtml(result.vacuna.nombre)}</h3><p>${escapeHtml(result.vacuna.descripcion || 'Esta vacuna no tiene descripción.')}</p>`
  detail.hidden = false
})

async function init() {
  feedback.textContent = 'Cargando vacunas…'
  const result = await listVacunas()
  if (!result.ok) {
    feedback.textContent = result.message
    return
  }
  feedback.textContent = ''
  list.innerHTML = result.vacunas.length ? result.vacunas.map((vacuna) => `
    <li class="admin-record"><div class="admin-record-copy"><strong>${escapeHtml(vacuna.nombre)}</strong><small>${escapeHtml(vacuna.descripcion || 'Sin descripción')}</small></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-id="${vacuna.id}" aria-label="Ver detalle de ${escapeHtml(vacuna.nombre)}">Ver detalle</button></div></li>
  `).join('') : '<li class="admin-empty">Aún no hay vacunas registradas.</li>'
}

init()
