import { escapeHtml, getApiUrl } from '../api/client.js'
import { listPets, listSuccessStories } from '../workflows/story-api.js'
import { mountAdminPage } from '../story-admin-page.js'

const API_OPTIONS = { apiUrl: getApiUrl(import.meta.env), fetchFn: window.fetch.bind(window) }
let pets = []

const root = mountAdminPage({
  storyId: 'HU06', eyebrow: 'ADOPCIONES QUE INSPIRAN', title: 'Historias de éxito',
  description: 'Conoce las historias de mascotas que encontraron una familia y un nuevo hogar.',
  sidebar: {
    sidebarLabel: 'Información de historias de éxito', petStatus: 'Consulta pública', petEmoji: '💚',
    petTitle: 'Historias con hogar', petTag: 'HU06', petSubtitle: 'Adopciones felices',
    asideDescription: 'Cada relato muestra el impacto de una adopción responsable.',
    helpTitle: 'Una historia para recordar',
    helpDescription: 'Selecciona una mascota para ver sus relatos publicados y la fecha de cada historia.',
    helpLink: { href: './HU05.html', label: 'Publicar una historia' },
    asideNote: 'Cada historia celebra un nuevo comienzo.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU06 · CASOS DE ÉXITO</p><h2>Historias de mascotas adoptadas</h2><p>Elige una mascota para consultar sus historias.</p></div></div>
    <div class="field admin-pet-filter"><label for="success-pet-filter">Mascota</label><select id="success-pet-filter"><option value="">Cargando mascotas…</option></select></div>
    <p id="success-public-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <ul id="success-public-list" class="admin-record-list" aria-label="Historias de éxito"></ul>
  `,
})

const petSelect = root.querySelector('#success-pet-filter')
const feedback = root.querySelector('#success-public-feedback')
const list = root.querySelector('#success-public-list')
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

async function renderStories() {
  const pet = pets.find((item) => String(item.id) === petSelect.value)
  if (!pet) {
    feedback.textContent = 'No es posible consultar las historias: la mascota no existe.'
    list.replaceChildren()
    return
  }
  if (pet.status === 'Inactivo') {
    feedback.textContent = 'No es posible consultar las historias: la mascota está inactiva.'
    list.replaceChildren()
    return
  }
  feedback.textContent = 'Cargando historias…'
  const result = await listSuccessStories(pet.id, API_OPTIONS)
  if (!result.ok) {
    feedback.textContent = result.message
    list.replaceChildren()
    return
  }
  if (result.stories.length === 0) {
    feedback.textContent = 'Esta mascota aún no tiene historias de éxito disponibles.'
    list.replaceChildren()
    return
  }
  feedback.textContent = `${result.stories.length} ${result.stories.length === 1 ? 'historia publicada' : 'historias publicadas'} para ${escape(pet.name)}.`
  list.innerHTML = result.stories.map((story) => `
    <li class="admin-record story-record"><div class="admin-record-copy"><strong>${escape(story.title)}</strong><small>${escape(story.description)}</small><small>Fecha: ${escape((story.createdAt || '').slice(0, 10) || 'No registrada')}</small></div></li>
  `).join('')
}

petSelect.addEventListener('change', renderStories)
const params = new URLSearchParams(window.location.search)

async function initialize() {
  const result = await listPets(API_OPTIONS)
  if (!result.ok) {
    petSelect.innerHTML = '<option value="">No fue posible cargar las mascotas</option>'
    feedback.textContent = result.message
    list.replaceChildren()
    return
  }
  pets = result.pets
  petSelect.innerHTML = pets.map((pet) => `<option value="${escapeHtml(pet.id)}">${escapeHtml(pet.name)}</option>`).join('')
  if (params.has('mascota')) petSelect.value = params.get('mascota')
  if (!petSelect.value && pets.length) petSelect.value = String(pets[0].id)
  await renderStories()
}

initialize()