import '../style.css'
import '../HU24.css'
import {
  createReview,
  fetchAdopters,
  fetchPets,
  fetchReviews,
  getApiUrl,
  updateReview,
} from '../workflows/HU24.js'

const API_URL = getApiUrl(import.meta.env)
const app = document.querySelector('#app')

let pets = []
let adopters = []
let reviews = []
let editingReview = null

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function today() {
  const date = new Date()
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

function renderOptions(items, placeholder) {
  return `<option value="">${placeholder}</option>${items.map((item) => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>
  `).join('')}`
}

function renderReview(review) {
  return `
    <article class="hu24-review" data-testid="review-card">
      <div class="hu24-review-top">
        <div>
          <h3>Reseña #${escapeHtml(review.id)}</h3>
          <p class="hu24-review-pet">${escapeHtml(review.petName)}</p>
        </div>
        <span class="hu24-rating">${escapeHtml(review.rating)} / 5 ★</span>
      </div>
      <p class="hu24-review-comment">${escapeHtml(review.comment)}</p>
      <div class="hu24-review-meta">
        <span>Fecha: ${escapeHtml(review.date)}</span>
        <span>Adoptante: ${escapeHtml(review.adopterName)}</span>
      </div>
      <button class="hu24-edit-button" type="button" data-edit-id="${escapeHtml(review.id)}">
        Editar reseña
      </button>
    </article>
  `
}

function renderReviews() {
  const container = document.querySelector('#review-list')
  const count = document.querySelector('#review-count')

  count.textContent = `${reviews.length} reseña${reviews.length === 1 ? '' : 's'}`

  if (reviews.length === 0) {
    container.innerHTML = '<p class="hu24-empty">Todavía no hay reseñas registradas.</p>'
    return
  }

  container.innerHTML = reviews.map(renderReview).join('')
}

function renderPage() {
  app.innerHTML = `
    <main class="hu24-main">
      <header class="hu24-header">
        <a href="./index.html" class="hu24-back">← Volver al inicio</a>
        <p class="hu24-eyebrow">HUELLITAS · EXPERIENCIAS</p>
        <h1>Reseñas de mascotas</h1>
        <p>Comparte tu experiencia y ayuda a otras personas en su proceso de adopción.</p>
      </header>

      <section class="hu24-panel" aria-labelledby="form-title">
        <div class="hu24-section-heading">
          <div>
            <p class="hu24-eyebrow">TU EXPERIENCIA</p>
            <h2 id="form-title">Publicar una reseña</h2>
          </div>
        </div>

        <form id="review-form" class="hu24-form">
          <div class="hu24-field">
            <label for="mascotaId">Mascota *</label>
            <select id="mascotaId" name="mascotaId" required>
              ${renderOptions(pets, 'Selecciona una mascota')}
            </select>
            <small data-error="mascotaId"></small>
          </div>

          <div class="hu24-field">
            <label for="adoptanteId">Adoptante (opcional)</label>
            <select id="adoptanteId" name="adoptanteId">
              ${renderOptions(adopters, 'Sin adoptante asociado')}
            </select>
            <small data-error="adoptanteId"></small>
          </div>

          <div class="hu24-field">
            <label for="calificacion">Calificación *</label>
            <select id="calificacion" name="calificacion" required>
              <option value="">Selecciona una calificación</option>
              <option value="1">1 - Muy mala</option>
              <option value="2">2 - Mala</option>
              <option value="3">3 - Regular</option>
              <option value="4">4 - Buena</option>
              <option value="5">5 - Excelente</option>
            </select>
            <small data-error="calificacion"></small>
          </div>

          <div class="hu24-field">
            <label for="fecha">Fecha *</label>
            <input id="fecha" name="fecha" type="date" value="${today()}" required />
            <small data-error="fecha"></small>
          </div>

          <div class="hu24-field hu24-field-wide">
            <label for="comentario">Comentario *</label>
            <textarea id="comentario" name="comentario" rows="4" maxlength="1000" placeholder="Cuéntanos cómo fue tu experiencia..." required></textarea>
            <small data-error="comentario"></small>
          </div>

          <div id="form-message" class="hu24-message" role="alert" hidden></div>

          <div class="hu24-actions">
            <button id="submit-review" class="hu24-primary-button" type="submit">
              Publicar reseña
            </button>
            <button id="cancel-edit" class="hu24-secondary-button" type="button" hidden>
              Cancelar edición
            </button>
          </div>
        </form>
      </section>

      <section class="hu24-panel" aria-labelledby="reviews-title">
        <div class="hu24-section-heading">
          <div>
            <p class="hu24-eyebrow">OPINIONES COMPARTIDAS</p>
            <h2 id="reviews-title">Reseñas registradas</h2>
          </div>
          <span id="review-count" class="hu24-count" role="status">0 reseñas</span>
        </div>
        <div id="review-list" class="hu24-review-list">
          <p class="hu24-empty">Cargando reseñas...</p>
        </div>
      </section>

      <div id="page-message" class="hu24-page-message" role="alert" hidden></div>
    </main>
  `

  document.querySelector('#review-form').addEventListener('submit', handleSubmit)
  document.querySelector('#cancel-edit').addEventListener('click', cancelEdit)
  document.querySelector('#review-list').addEventListener('click', handleReviewClick)
}

function formValues() {
  const form = document.querySelector('#review-form')
  const data = new FormData(form)

  return {
    mascotaId: editingReview ? String(editingReview.petId) : data.get('mascotaId'),
    adoptanteId: editingReview ? String(editingReview.adopterId ?? '') : data.get('adoptanteId'),
    calificacion: data.get('calificacion'),
    fecha: editingReview ? editingReview.date : data.get('fecha'),
    comentario: data.get('comentario'),
  }
}

function showMessage(message, type = 'error') {
  const element = document.querySelector('#form-message')
  element.textContent = message
  element.className = `hu24-message hu24-message-${type}`
  element.hidden = false
}

function clearMessage() {
  const element = document.querySelector('#form-message')
  element.textContent = ''
  element.hidden = true
}

function showPageError(message) {
  const element = document.querySelector('#page-message')
  element.textContent = message
  element.hidden = false
}

function clearPageError() {
  const element = document.querySelector('#page-message')
  element.textContent = ''
  element.hidden = true
}

function clearFieldErrors() {
  document.querySelectorAll('[data-error]').forEach((element) => {
    element.textContent = ''
  })
}

function setFormValues(review) {
  document.querySelector('#mascotaId').value = String(review.petId ?? '')
  document.querySelector('#adoptanteId').value = review.adopterId ? String(review.adopterId) : ''
  document.querySelector('#calificacion').value = String(review.rating)
  document.querySelector('#fecha').value = review.date
  document.querySelector('#comentario').value = review.comment
}

function startEdit(review) {
  editingReview = review
  setFormValues(review)

  document.querySelector('#form-title').textContent = `Editar reseña #${review.id}`
  document.querySelector('#submit-review').textContent = 'Guardar cambios'
  document.querySelector('#cancel-edit').hidden = false

  document.querySelector('#review-form').scrollIntoView({ behavior: 'smooth' })
  document.querySelector('#mascotaId').disabled = true
  document.querySelector('#adoptanteId').disabled = true
  document.querySelector('#fecha').disabled = true
}

function cancelEdit() {
  editingReview = null
  document.querySelector('#review-form').reset()
  document.querySelector('#fecha').value = today()
  document.querySelector('#form-title').textContent = 'Publicar una reseña'
  document.querySelector('#submit-review').textContent = 'Publicar reseña'
  document.querySelector('#cancel-edit').hidden = true
  document.querySelector('#mascotaId').disabled = false
  document.querySelector('#adoptanteId').disabled = false
  document.querySelector('#fecha').disabled = false
  clearMessage()
  clearFieldErrors()
}

async function handleReviewClick(event) {
  const button = event.target.closest('[data-edit-id]')
  if (!button) return

  const review = reviews.find((item) => String(item.id) === button.dataset.editId)
  if (review) startEdit(review)
}

async function handleSubmit(event) {
  event.preventDefault()
  clearMessage()
  clearFieldErrors()
  clearPageError()

  const values = formValues()
  const button = document.querySelector('#submit-review')
  const isEditing = Boolean(editingReview)

  button.disabled = true

  try {
    if (isEditing) {
      await updateReview(editingReview.id, values, fetch, API_URL)
    } else {
      await createReview(values, fetch, API_URL)
    }

    await loadReviews()
    cancelEdit()

    showMessage(
      isEditing
        ? 'La reseña se actualizó correctamente.'
        : 'La reseña se publicó correctamente.',
      'success',
    )
  } catch (error) {
    showMessage(error.message)
  } finally {
    button.disabled = false
  }
}

async function loadReviews() {
  reviews = await fetchReviews(fetch, API_URL)
  renderReviews()
}

async function loadPage() {
  renderPage()

  try {
    const results = await Promise.all([
      fetchPets(fetch, API_URL),
      fetchAdopters(fetch, API_URL),
      fetchReviews(fetch, API_URL),
    ])

    pets = results[0]
    adopters = results[1]
    reviews = results[2]

    document.querySelector('#mascotaId').innerHTML = renderOptions(pets, 'Selecciona una mascota')
    document.querySelector('#adoptanteId').innerHTML = renderOptions(adopters, 'Sin adoptante asociado')

    renderReviews()
  } catch (error) {
    showPageError(error.message)
    document.querySelector('#review-list').innerHTML = '<p class="hu24-empty">No fue posible cargar las reseñas.</p>'
  }
}

loadPage()