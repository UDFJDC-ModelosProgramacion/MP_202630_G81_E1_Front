import { escapeHtml, getApiUrl } from '../api/client.js'
import { createPhoto, deletePhoto, listPets, listPhotos, setPrincipalPhoto, updatePhoto } from '../workflows/story-api.js'
import { mountAdminPage } from '../story-admin-page.js'

const API_OPTIONS = { apiUrl: getApiUrl(import.meta.env), fetchFn: window.fetch.bind(window) }
let pets = []
let photos = []

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
    <div class="field admin-pet-filter"><label for="photo-pet">Mascota</label><select id="photo-pet"><option value="">Cargando mascotas…</option></select></div>
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
  list.innerHTML = photos.length ? photos.map((photo) => `
    <li class="admin-record photo-record">
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.description || `Foto de ${photo.petName}`)}" loading="lazy">
      <div class="admin-record-copy"><strong>${escapeHtml(photo.description || 'Fotografía sin descripción')}</strong>${photo.principal ? '<span class="record-badge">Principal</span>' : ''}<small>${escapeHtml(photo.url)}</small></div>
      <div class="admin-record-actions">
        ${photo.principal ? '' : `<button class="secondary-button" type="button" data-action="principal" data-id="${photo.id}">Marcar principal</button>`}
        <button class="secondary-button" type="button" data-action="edit" data-id="${photo.id}">Editar</button>
        <button class="secondary-button danger-button" type="button" data-action="delete" data-id="${photo.id}">Eliminar</button>
      </div>
    </li>
  `).join('') : '<li class="admin-empty">Esta mascota aún no tiene fotografías.</li>'
}

async function loadPhotos() {
  list.innerHTML = '<li class="admin-empty">Cargando fotografías…</li>'
  if (!petSelect.value) {
    photos = []
    renderPhotos()
    return
  }
  const result = await listPhotos(petSelect.value, API_OPTIONS)
  if (!result.ok) {
    feedback.textContent = result.message
    photos = []
    list.innerHTML = '<li class="admin-empty">No fue posible cargar las fotografías.</li>'
    return
  } else {
    photos = result.photos
  }
  renderPhotos()
}

function resetForm() {
  form.reset()
  idInput.value = ''
  root.querySelector('#photo-form-title').textContent = 'Agregar fotografía'
  root.querySelector('#photo-cancel').hidden = true
}

petSelect.addEventListener('change', loadPhotos)
root.querySelector('#photo-cancel').addEventListener('click', resetForm)
list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  try {
    const { action, id } = button.dataset
    const photo = photos.find((item) => String(item.id) === id)
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
    const result = action === 'principal'
      ? await setPrincipalPhoto(petSelect.value, id, API_OPTIONS)
      : await deletePhoto(petSelect.value, id, API_OPTIONS)
    if (!result.ok) throw new Error(result.message)
    feedback.textContent = action === 'delete' ? 'Fotografía eliminada.' : 'Fotografía principal actualizada.'
    await loadPhotos()
  } catch (error) {
    feedback.textContent = error.message
  }
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const values = { url: urlInput.value.trim(), description: descriptionInput.value.trim(), principal: principalInput.checked }
  const error = !petSelect.value
    ? 'Selecciona una mascota.'
    : !/^https?:\/\/\S+$/i.test(values.url) ? 'Ingresa una URL válida para la fotografía.' : ''
  root.querySelector('#photo-url-error').textContent = error
  if (error) {
    feedback.textContent = error
    return
  }
  try {
    const shouldBePrincipal = values.principal
      || (idInput.value ? photos.find((photo) => String(photo.id) === idInput.value)?.principal : photos.length === 0)
    const photoValues = { ...values, principal: shouldBePrincipal }
    let result = idInput.value
      ? await updatePhoto(petSelect.value, idInput.value, photoValues, API_OPTIONS)
      : await createPhoto(petSelect.value, photoValues, API_OPTIONS)
    if (!result.ok) throw new Error(result.message)
    if (shouldBePrincipal) {
      const photoId = idInput.value || result.photo?.id
      if (!photoId) throw new Error('El servidor no devolvió el identificador de la fotografía.')
      result = await setPrincipalPhoto(petSelect.value, photoId, API_OPTIONS)
      if (!result.ok) throw new Error(result.message)
    }
    resetForm()
    await loadPhotos()
    feedback.textContent = 'Fotografía guardada.'
  } catch (error) {
    feedback.textContent = error.message
  }
})

async function initialize() {
  const result = await listPets(API_OPTIONS)
  if (!result.ok) {
    petSelect.innerHTML = '<option value="">No fue posible cargar las mascotas</option>'
    feedback.textContent = result.message
    list.innerHTML = '<li class="admin-empty">No fue posible cargar las fotografías.</li>'
    return
  }
  pets = result.pets
  petSelect.innerHTML = pets.map((pet) => `<option value="${escapeHtml(pet.id)}">${escapeHtml(pet.name)}</option>`).join('')
  if (!pets.length) {
    petSelect.innerHTML = '<option value="">No hay mascotas registradas</option>'
    await loadPhotos()
    return
  }
  await loadPhotos()
}

initialize()