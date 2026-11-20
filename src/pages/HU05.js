import { escapeHtml, getApiUrl } from '../api/client.js'
import { createSuccessStory, deleteSuccessStory, listPets, listSuccessStories, updateSuccessStory } from '../workflows/story-api.js'
import { mountAdminPage } from '../story-admin-page.js'

const API_OPTIONS = { apiUrl: getApiUrl(import.meta.env), fetchFn: window.fetch.bind(window) }
let pets = []
let stories = []

const root = mountAdminPage({
  storyId: 'HU05', eyebrow: 'ADOPCIONES QUE INSPIRAN', title: 'Publicar historia de éxito',
  description: 'Comparte cómo una mascota encontró su hogar y promueve la adopción responsable.',
  sidebar: {
    sidebarLabel: 'Ayuda para publicar historias', petStatus: 'Panel del refugio', petEmoji: '💚',
    petTitle: 'Historias con hogar', petTag: 'HU05', petSubtitle: 'Adopciones felices',
    asideDescription: 'Los relatos publicados ayudan a otras familias a conocer el impacto de adoptar.',
    helpTitle: 'Antes de publicar',
    helpDescription: 'Vincula la historia a una mascota activa y agrega un título y una descripción.',
    helpLink: { href: './HU33.html', label: 'Consultar mascotas' },
    asideNote: 'Cada historia celebra un nuevo comienzo.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU05 · CASOS DE ÉXITO</p><h2 id="success-form-title">Nueva historia</h2><p>Publica relatos de mascotas que encontraron un hogar.</p></div></div>
    <p id="success-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <div class="admin-split">
      <form id="success-form" class="admin-form" novalidate>
        <input id="success-id" type="hidden">
        <div class="field"><label for="success-pet">Mascota <span aria-hidden="true">*</span></label><select id="success-pet" required><option value="">Cargando mascotas…</option></select><small class="field-error" id="success-pet-error"></small></div>
        <div class="field"><label for="success-title">Título <span aria-hidden="true">*</span></label><input id="success-title" required placeholder="Ej. Luna ya tiene hogar"></div>
        <div class="field"><label for="success-description">Descripción <span aria-hidden="true">*</span></label><textarea id="success-description" rows="5" required placeholder="Cuenta cómo encontró su hogar..."></textarea></div>
        <div class="admin-actions"><button class="submit-button" type="submit">Publicar historia <span aria-hidden="true">→</span></button><button id="success-cancel" class="secondary-button" type="button" hidden>Cancelar</button></div>
      </form>
      <section class="admin-recent"><h3>Historias publicadas</h3><ul id="success-list" class="admin-record-list"></ul></section>
    </div>
  `,
})

const form = root.querySelector('#success-form')
const idInput = root.querySelector('#success-id')
const petInput = root.querySelector('#success-pet')
const titleInput = root.querySelector('#success-title')
const descriptionInput = root.querySelector('#success-description')
const list = root.querySelector('#success-list')
const feedback = root.querySelector('#success-feedback')
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

function renderStories() {
  list.innerHTML = stories.length ? stories.map((story) => `
    <li class="admin-record story-record"><div class="admin-record-copy"><strong>${escape(story.title)}</strong><small>${escape(story.petName)} · ${escape(story.description)}</small></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-action="edit" data-id="${escape(story.id)}">Editar</button><button class="secondary-button danger-button" type="button" data-action="delete" data-id="${escape(story.id)}">Eliminar</button></div></li>
  `).join('') : '<li class="admin-empty">Aún no hay historias publicadas.</li>'
}

async function loadStories() {
  const results = await Promise.all(pets.map((pet) => listSuccessStories(pet.id, API_OPTIONS)))
  const failed = results.find((result) => !result.ok)
  if (failed) {
    feedback.textContent = failed.message
    stories = []
    list.innerHTML = '<li class="admin-empty">No fue posible cargar las historias.</li>'
    return false
  } else {
    stories = results.flatMap((result) => result.stories)
  }
  renderStories()
  return true
}

function resetForm() {
  form.reset()
  idInput.value = ''
  petInput.disabled = false
  root.querySelector('#success-form-title').textContent = 'Nueva historia'
  root.querySelector('#success-cancel').hidden = true
}

root.querySelector('#success-cancel').addEventListener('click', resetForm)
list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  try {
    const story = stories.find((item) => String(item.id) === button.dataset.id)
    if (button.dataset.action === 'edit' && story) {
      const pet = pets.find((item) => String(item.id) === String(story.petId))
      if (!pet || pet.status === 'Inactivo') throw new Error('Solo se pueden editar historias de mascotas activas.')
      idInput.value = story.id
      petInput.value = story.petId
      petInput.disabled = true
      titleInput.value = story.title
      descriptionInput.value = story.description
      root.querySelector('#success-form-title').textContent = 'Editar historia'
      root.querySelector('#success-cancel').hidden = false
      titleInput.focus()
      return
    }
    if (!story) throw new Error('No encontramos la historia seleccionada.')
    const result = await deleteSuccessStory(story.petId, button.dataset.id, API_OPTIONS)
    if (!result.ok) throw new Error(result.message)
    feedback.textContent = 'Historia eliminada.'
    await loadStories()
  } catch (error) {
    feedback.textContent = error.message
  }
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const pet = pets.find((item) => String(item.id) === petInput.value)
  const error = !pet
    ? 'Selecciona una mascota.'
    : pet.status === 'Inactivo' ? 'Solo se pueden publicar historias de mascotas activas.'
      : !titleInput.value.trim() ? 'Escribe un título para la historia.'
        : !descriptionInput.value.trim() ? 'Escribe la descripción de la historia.' : ''
  root.querySelector('#success-pet-error').textContent = error && (!pet || pet.status === 'Inactivo') ? error : ''
  if (error) {
    feedback.textContent = error
    return
  }
  try {
    const values = {
      title: titleInput.value,
      description: descriptionInput.value,
      date: stories.find((story) => String(story.id) === idInput.value)?.createdAt || new Date().toISOString().slice(0, 10),
    }
    const result = idInput.value
      ? await updateSuccessStory(petInput.value, idInput.value, values, API_OPTIONS)
      : await createSuccessStory(petInput.value, values, API_OPTIONS)
    if (!result.ok) throw new Error(result.message)
    const wasEditing = Boolean(idInput.value)
    resetForm()
    if (await loadStories()) feedback.textContent = wasEditing ? 'Historia actualizada.' : 'Historia publicada.'
  } catch (error) {
    feedback.textContent = error.message
  }
})

petInput.addEventListener('change', () => {
  const pet = pets.find((item) => String(item.id) === petInput.value)
  if (pet && pet.status === 'Inactivo') {
    root.querySelector('#success-pet-error').textContent = 'Esta mascota no está activa.'
  } else {
    root.querySelector('#success-pet-error').textContent = ''
  }
})

async function initialize() {
  const result = await listPets(API_OPTIONS)
  if (!result.ok) {
    petInput.innerHTML = '<option value="">No fue posible cargar las mascotas</option>'
    feedback.textContent = result.message
    renderStories()
    return
  }
  pets = result.pets
  petInput.innerHTML = `<option value="">Selecciona una mascota</option>${pets.map((pet) => `<option value="${escapeHtml(pet.id)}" ${pet.status === 'Inactivo' ? 'disabled' : ''}>${escapeHtml(pet.name)}${pet.status === 'Inactivo' ? ' (Inactiva)' : ''}</option>`).join('')}`
  await loadStories()
}

initialize()