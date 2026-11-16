import { escapeHtml, toDateOnly } from '../api/client.js'
import { listMascotas } from '../workflows/HU14.js'
import { getVaccinationHistory } from '../workflows/HU15.js'
import { mountAdminPage } from '../story-admin-page.js'

const root = mountAdminPage({
  storyId: 'HU15', eyebrow: 'CONSULTA PÚBLICA', title: 'Historial de vacunación',
  description: 'Verifica que una mascota tenga sus vacunas al día antes de adoptarla.',
  sidebar: {
    sidebarLabel: 'Ayuda para consultar vacunación', petStatus: 'Consulta pública', petEmoji: '📋',
    petTitle: 'Vacunas aplicadas', petTag: 'HU15', petSubtitle: 'Historial de salud',
    asideDescription: 'Las vacunas aparecen de la más reciente a la más antigua. La consulta es de solo lectura.',
    helpTitle: 'Cómo usarlo',
    helpDescription: 'Selecciona una mascota para ver sus vacunas, el lote y la próxima fecha programada.',
    helpLink: { href: './HU12.html', label: 'Ver catálogo de vacunas' },
    asideNote: 'Una mascota con vacunas al día está lista para su nuevo hogar.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU15 · HISTORIAL</p><h2>Vacunas de la mascota</h2><p>Elige una mascota para consultar su historial.</p></div></div>
    <div class="field admin-pet-filter"><label for="history-mascota">Mascota</label><select id="history-mascota"><option value="">Selecciona una mascota</option></select></div>
    <p id="history-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <ul id="history-list" class="admin-record-list" aria-label="Vacunas aplicadas"></ul>
  `,
})

const select = root.querySelector('#history-mascota')
const feedback = root.querySelector('#history-feedback')
const list = root.querySelector('#history-list')

select.addEventListener('change', async () => {
  list.replaceChildren()
  if (!select.value) {
    feedback.textContent = ''
    return
  }
  feedback.textContent = 'Cargando historial…'
  const result = await getVaccinationHistory(select.value)
  if (!result.ok) {
    feedback.textContent = result.message
    return
  }
  feedback.textContent = result.registros.length ? '' : 'Esta mascota aún no tiene vacunas registradas.'
  list.innerHTML = result.registros.map((registro) => `
    <li class="admin-record"><div class="admin-record-copy"><strong>${escapeHtml(registro.vacuna?.nombre ?? 'Vacuna')}</strong><small>Aplicada el ${escapeHtml(toDateOnly(registro.fechaAplicacion))} · Lote ${escapeHtml(registro.numeroLote)}${registro.proximaFecha ? ` · Próxima: ${escapeHtml(toDateOnly(registro.proximaFecha))}` : ''}</small></div><span class="record-badge">Vacunación</span></li>
  `).join('')
})

async function init() {
  const result = await listMascotas()
  if (!result.ok) {
    feedback.textContent = result.message
    return
  }
  select.insertAdjacentHTML('beforeend', result.mascotas.map((mascota) => `<option value="${mascota.id}">${escapeHtml(mascota.nombre)}</option>`).join(''))
}

init()
