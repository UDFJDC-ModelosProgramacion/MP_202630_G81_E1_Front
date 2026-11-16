import { pets } from '../gallery.js'
import {
  createSuccessStory,
  deleteSuccessStory,
  getSuccessStories,
  isActivePet,
  saveSuccessStory,
  updateSuccessStory,
  validateSuccessStory,
} from '../workflows/HU05.js'
import { mountAdminPage } from '../story-admin-page.js'

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
        <div class="field"><label for="success-pet">Mascota <span aria-hidden="true">*</span></label><select id="success-pet" required><option value="">Selecciona una mascota</option>${pets.map((pet) => `<option value="${pet.id}">${pet.name}</option>`).join('')}</select><small class="field-error" id="success-pet-error"></small></div>
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
  const stories = getSuccessStories(window.localStorage)
  list.innerHTML = stories.length ? stories.map((story) => `
    <li class="admin-record story-record"><div class="admin-record-copy"><strong>${escape(story.title)}</strong><small>${escape(story.petName)} · ${escape(story.description)}</small></div><div class="admin-record-actions"><button class="secondary-button" type="button" data-action="edit" data-id="${escape(story.id)}">Editar</button><button class="secondary-button danger-button" type="button" data-action="delete" data-id="${escape(story.id)}">Eliminar</button></div></li>
  `).join('') : '<li class="admin-empty">Aún no hay historias publicadas.</li>'
}

function resetForm() {
  form.reset()
  idInput.value = ''
  root.querySelector('#success-form-title').textContent = 'Nueva historia'
  root.querySelector('#success-cancel').hidden = true
}

root.querySelector('#success-cancel').addEventListener('click', resetForm)
list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  try {
    const story = getSuccessStories(window.localStorage).find((item) => item.id === button.dataset.id)
    if (button.dataset.action === 'edit' && story) {
      if (!isActivePet(story.petId, window.localStorage)) throw new Error('Solo se pueden editar historias de mascotas activas.')
      idInput.value = story.id
      petInput.value = story.petId
      titleInput.value = story.title
      descriptionInput.value = story.description
      root.querySelector('#success-form-title').textContent = 'Editar historia'
      root.querySelector('#success-cancel').hidden = false
      titleInput.focus()
      return
    }
    deleteSuccessStory(window.localStorage, button.dataset.id)
    feedback.textContent = 'Historia eliminada.'
    renderStories()
  } catch (error) {
    feedback.textContent = error.message
  }
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const values = { petId: petInput.value, title: titleInput.value, description: descriptionInput.value }
  const errors = validateSuccessStory(values, window.localStorage)
  root.querySelector('#success-pet-error').textContent = errors.petId ?? ''
  if (Object.keys(errors).length) {
    feedback.textContent = Object.values(errors)[0]
    return
  }
  try {
    if (idInput.value) updateSuccessStory(window.localStorage, idInput.value, values)
    else saveSuccessStory(window.localStorage, createSuccessStory(values))
    feedback.textContent = idInput.value ? 'Historia actualizada.' : 'Historia publicada.'
    resetForm()
    renderStories()
  } catch (error) {
    feedback.textContent = error.message
  }
})

petInput.addEventListener('change', () => {
  if (petInput.value && !isActivePet(petInput.value, window.localStorage)) {
    root.querySelector('#success-pet-error').textContent = 'Esta mascota no está activa.'
  } else {
    root.querySelector('#success-pet-error').textContent = ''
  }
})

renderStories()