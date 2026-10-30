import { pets } from '../gallery.js'
import {
  createPhoto,
  deletePhoto,
  getPhotos,
  savePhoto,
  setPrincipalPhoto,
  updatePhoto,
  validatePhoto,
} from '../workflows/HU02.js'
import { mountAdminPage } from '../story-admin-page.js'

const root = mountAdminPage({
  storyId: 'HU02',
  eyebrow: 'GESTIÓN DE GALERÍA',
  title: 'Gestionar fotografías',
  description: 'Mantén actualizada la ficha de publicación de cada mascota.',
  sidebar: {
    sidebarLabel: 'Ayuda para gestionar fotografías', petStatus: 'Panel del refugio', petEmoji: '📷',
    petTitle: 'Galería al día', petTag: 'HU02', petSubtitle: 'Fotos de mascotas',
    asideDescription: 'Administra las imágenes que visitantes verán en la galería pública.',
    helpTitle: 'Fotografía principal',
    helpDescription: 'Cada mascota tiene una imagen representativa. Al elegir otra, la anterior deja de ser principal.',
    helpLink: { href: './HU01.html', label: 'Abrir galería pública' },
    asideNote: 'Usa una URL pública que el navegador pueda mostrar.',
  },
  content: `
    <div class="admin-heading"><div><p class="step-label">HU02 · FICHA DE MASCOTA</p><h2>Fotografías registradas</h2><p>Agrega, edita, marca como principal o elimina imágenes.</p></div></div>
    <div class="field admin-pet-filter"><label for="photo-pet">Mascota</label><select id="photo-pet">${pets.map((pet) => `<option value="${pet.id}">${pet.name}</option>`).join('')}</select></div>
    <p id="photo-feedback" class="admin-feedback" role="status" aria-live="polite"></p>
    <ul id="photo-list" class="admin-record-list" aria-label="Fotografías de la mascota"></ul>
    <form id="photo-form" class="admin-form" novalidate>
      <h3 id="photo-form-title">Agregar fotografía</h3>
      <input id="photo-id" type="hidden">
      <div class="field"><label for="photo-url">URL de la fotografía <span aria-hidden="true">*</span></label><input id="photo-url" name="url" type="url" placeholder="https://.../foto.jpg" required><small id="photo-url-error" class="field-error"></small></div>
      <div class="field"><label for="photo-description">Descripción (opcional)</label><textarea id="photo-description" name="description" rows="3" placeholder="Describe la imagen..."></textarea></div>
      <label class="admin-check"><input id="photo-principal" type="checkbox"> Marcar como fotografía principal</label>
      <div class="admin-actions"><button class="submit-button" type="submit">Guardar fotografía <span aria-hidden="true">→</span></button><button id="photo-cancel" class="secondary-button" type="button" hidden>Cancelar</button></div>
    </form>
  `,
})

const petSelect = root.querySelector('#photo-pet')
const list = root.querySelector('#photo-list')
const form = root.querySelector('#photo-form')
const feedback = root.querySelector('#photo-feedback')
const idInput = root.querySelector('#photo-id')
const urlInput = root.querySelector('#photo-url')
const descriptionInput = root.querySelector('#photo-description')
const principalInput = root.querySelector('#photo-principal')

function renderPhotos() {
  const photos = getPhotos(window.localStorage, petSelect.value)
  list.innerHTML = photos.length ? photos.map((photo) => `
    <li class="admin-record photo-record">
      <img src="${photo.url}" alt="${photo.description || `Foto de ${photo.petName}`}" loading="lazy">
      <div class="admin-record-copy"><strong>${photo.description || 'Fotografía sin descripción'}</strong>${photo.principal ? '<span class="record-badge">Principal</span>' : ''}<small>${photo.url}</small></div>
      <div class="admin-record-actions">
        ${photo.principal ? '' : `<button class="secondary-button" type="button" data-action="principal" data-id="${photo.id}">Marcar principal</button>`}
        <button class="secondary-button" type="button" data-action="edit" data-id="${photo.id}">Editar</button>
        <button class="secondary-button danger-button" type="button" data-action="delete" data-id="${photo.id}">Eliminar</button>
      </div>
    </li>
  `).join('') : '<li class="admin-empty">Esta mascota aún no tiene fotografías.</li>'
}

function resetForm() {
  form.reset()
  idInput.value = ''
  root.querySelector('#photo-form-title').textContent = 'Agregar fotografía'
  root.querySelector('#photo-cancel').hidden = true
}

petSelect.addEventListener('change', renderPhotos)
root.querySelector('#photo-cancel').addEventListener('click', resetForm)
list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  try {
    const { action, id } = button.dataset
    const photo = getPhotos(window.localStorage, petSelect.value).find((item) => item.id === id)
    if (action === 'edit' && photo) {
      idInput.value = photo.id
      urlInput.value = photo.url
      descriptionInput.value = photo.description
      principalInput.checked = photo.principal
      root.querySelector('#photo-form-title').textContent = 'Editar fotografía'
      root.querySelector('#photo-cancel').hidden = false
      urlInput.focus()
      return
    }
    if (action === 'principal') setPrincipalPhoto(window.localStorage, petSelect.value, id)
    if (action === 'delete') deletePhoto(window.localStorage, petSelect.value, id)
    feedback.textContent = action === 'delete' ? 'Fotografía eliminada.' : 'Fotografía principal actualizada.'
    renderPhotos()
  } catch (error) {
    feedback.textContent = error.message
  }
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const values = { petId: petSelect.value, url: urlInput.value, description: descriptionInput.value }
  const errors = validatePhoto(values)
  root.querySelector('#photo-url-error').textContent = errors.url ?? errors.petId ?? ''
  if (Object.keys(errors).length) {
    feedback.textContent = Object.values(errors)[0]
    return
  }
  try {
    if (idInput.value) updatePhoto(window.localStorage, idInput.value, { ...values, principal: principalInput.checked })
    else savePhoto(window.localStorage, createPhoto(values, { principal: principalInput.checked }))
    feedback.textContent = 'Fotografía guardada.'
    resetForm()
    renderPhotos()
  } catch (error) {
    feedback.textContent = error.message
  }
})

renderPhotos()