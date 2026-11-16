import { pets } from '../gallery.js'
import { filterTimeline, getTimeline, TIMELINE_TYPES, validateTimelineFilters } from '../workflows/HU04.js'
import { mountAdminPage } from '../story-admin-page.js'

const root = mountAdminPage({
  storyId: 'HU04', eyebrow: 'CONSULTA PÚBLICA', title: 'Línea de tiempo de vida',
  description: 'Consulta la trayectoria de eventos de una mascota antes de adoptarla.',
  sidebar: {
    sidebarLabel: 'Ayuda para consultar eventos', petStatus: 'Consulta pública', petEmoji: '🗓️',
    petTitle: 'Una vida en el tiempo', petTag: 'HU04', petSubtitle: 'Historial cronológico',
    asideDescription: 'Los eventos y registros de adopción se presentan ordenados por fecha.',
    helpTitle: 'Filtra la trayectoria',
    helpDescription: 'Combina tipo de evento y rango de fechas para consultar un periodo específico.',
    helpLink: { href: './HU03.html', label: 'Registrar evento de vida' },
    asideNote: 'Si una mascota no aparece, revisa su identificador.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU04 · HISTORIAL</p><h2 id="timeline-title">Eventos de vida</h2><p id="timeline-pet"></p></div></div>
    <form id="timeline-filters" class="admin-form timeline-filters" novalidate>
      <div class="field"><label for="timeline-pet-select">Mascota</label><select id="timeline-pet-select" name="petId">${pets.map((pet) => `<option value="${pet.id}">${pet.name}</option>`).join('')}</select></div>
      <div class="field"><label for="timeline-type">Tipo de evento</label><select id="timeline-type" name="type">${TIMELINE_TYPES.map((type) => `<option>${type}</option>`).join('')}</select></div>
      <div class="field"><label for="timeline-from">Desde</label><input id="timeline-from" name="from" type="date"></div>
      <div class="field"><label for="timeline-to">Hasta</label><input id="timeline-to" name="to" type="date"><small class="field-hint">Incluye eventos posteriores a esta fecha.</small></div>
      <div class="admin-actions"><button class="submit-button" type="submit">Filtrar</button><button id="timeline-clear" class="secondary-button" type="reset">Limpiar</button></div>
    </form>
    <p id="timeline-feedback" class="admin-feedback" role="alert" hidden></p>
    <ol id="timeline-list" class="timeline-list" aria-label="Eventos ordenados cronológicamente"></ol>
    <p id="timeline-empty" class="admin-empty" hidden>No hay eventos para los filtros seleccionados.</p>
  `,
})

const params = new URLSearchParams(window.location.search)
const petSelect = root.querySelector('#timeline-pet-select')
if (params.has('mascota')) petSelect.value = params.get('mascota')
const form = root.querySelector('#timeline-filters')
const list = root.querySelector('#timeline-list')
const feedback = root.querySelector('#timeline-feedback')
const empty = root.querySelector('#timeline-empty')
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

function renderTimeline() {
  const timeline = getTimeline(window.localStorage, petSelect.value)
  if (timeline.status === 'not-found') {
    feedback.textContent = 'No encontramos a esta mascota.'
    feedback.hidden = false
    list.replaceChildren()
    empty.hidden = true
    return
  }
  feedback.hidden = true
  root.querySelector('#timeline-pet').textContent = `${timeline.pet.name} · ${timeline.pet.breed}`
  const filters = Object.fromEntries(new FormData(form).entries())
  const validation = validateTimelineFilters(filters)
  if (validation) {
    feedback.textContent = validation
    feedback.hidden = false
    return
  }
  const events = filterTimeline(timeline.events, filters)
  list.innerHTML = events.map((item) => `
    <li class="timeline-item"><span class="timeline-dot" aria-hidden="true"></span><article><span class="record-badge">${escape(item.type)}</span><time datetime="${escape(item.date)}">${escape(item.date || 'Fecha no registrada')}</time><p>${escape(item.description)}</p></article></li>
  `).join('')
  empty.hidden = events.length !== 0
}

form.addEventListener('submit', (event) => { event.preventDefault(); renderTimeline() })
form.addEventListener('reset', () => requestAnimationFrame(renderTimeline))
petSelect.addEventListener('change', renderTimeline)
renderTimeline()