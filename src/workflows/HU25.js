
// HU25 - Consultar resenas de mascotas.
// Logica independiente del DOM para facilitar las pruebas.

export const DEFAULT_API_URL = 'http://localhost:8999/api'

export class ReviewsError extends Error {
  constructor(message, { status = null } = {}) {
    super(message)
    this.name = 'ReviewsError'
    this.status = status
  }
}

export function getApiUrl(env = {}) {
  const configured =
    typeof env.VITE_API_URL === 'string' ? env.VITE_API_URL.trim() : ''

  return (configured || DEFAULT_API_URL).replace(/\/+$/, '')
}

async function requestJson(fetchFn, url) {
  let response

  try {
    response = await fetchFn(url, {
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new ReviewsError(
      'No pudimos conectar con el servidor. Revisa tu conexion e intentalo de nuevo.'
    )
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new ReviewsError('No se encontro la resena solicitada.', {
        status: 404,
      })
    }

    throw new ReviewsError(
      'El servidor no pudo entregar las resenas en este momento.',
      { status: response.status }
    )
  }

  try {
    return await response.json()
  } catch {
    throw new ReviewsError(
      'El servidor respondio con datos que no se pueden leer.'
    )
  }
}

function validateList(data) {
  if (!Array.isArray(data)) {
    throw new ReviewsError('El servidor respondio con un formato inesperado.')
  }

  return data.map(normalizeReview)
}

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : fallback
}

export function normalizeReview(raw = {}) {
  const pet = raw.mascota ?? {}
  const adopter = raw.adoptante ?? {}

  return {
    id: raw.id ?? null,
    rating:
      Number.isInteger(raw.calificacion) &&
      raw.calificacion >= 1 &&
      raw.calificacion <= 5
        ? raw.calificacion
        : null,
    comment: text(raw.comentario, 'Sin comentario'),
    date: text(raw.fecha, 'Fecha no registrada'),
    petId: pet.id ?? null,
    petName: text(pet.nombre, 'Mascota no registrada'),
    adopterId: adopter.id ?? null,
    adopterName: text(adopter.nombre, 'Adoptante no registrado'),
  }
}

export async function fetchAllReviews(
  fetchFn,
  apiUrl = DEFAULT_API_URL
) {
  const data = await requestJson(fetchFn, `${apiUrl}/resenas`)
  return validateList(data)
}

export async function fetchReviewsByPet(
  fetchFn,
  petId,
  apiUrl = DEFAULT_API_URL
) {
  if (!Number.isInteger(Number(petId)) || Number(petId) <= 0) {
    throw new ReviewsError('Ingresa un ID de mascota valido.')
  }

  const data = await requestJson(
    fetchFn,
    `${apiUrl}/resenas/mascota/${Number(petId)}`
  )

  return validateList(data)
}

export async function fetchReviewsByAdopter(
  fetchFn,
  adopterId,
  apiUrl = DEFAULT_API_URL
) {
  if (!Number.isInteger(Number(adopterId)) || Number(adopterId) <= 0) {
    throw new ReviewsError('Ingresa un ID de adoptante valido.')
  }

  const data = await requestJson(
    fetchFn,
    `${apiUrl}/resenas/adoptante/${Number(adopterId)}`
  )

  return validateList(data)
}

export async function fetchReviewsByRating(
  fetchFn,
  rating,
  apiUrl = DEFAULT_API_URL
) {
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    throw new ReviewsError('La calificacion debe estar entre 1 y 5.')
  }

  const data = await requestJson(
    fetchFn,
    `${apiUrl}/resenas/calificacion/${Number(rating)}`
  )

  return validateList(data)
}

export async function fetchReviewById(
  fetchFn,
  reviewId,
  apiUrl = DEFAULT_API_URL
) {
  if (!Number.isInteger(Number(reviewId)) || Number(reviewId) <= 0) {
    throw new ReviewsError('Ingresa un ID de resena valido.')
  }

  const data = await requestJson(
    fetchFn,
    `${apiUrl}/resenas/${Number(reviewId)}`
  )

  return normalizeReview(data)
}

export function filterReviewsByRating(reviews, rating = '') {
  if (rating === '') return reviews

  const selectedRating = Number(rating)

  return reviews.filter((review) => review.rating === selectedRating)
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function renderReviewCard(review) {
  return `
    <li class="review-card" data-testid="review-card">
      <div class="review-card-header">
        <h3>${escapeHtml(review.petName)}</h3>
        <span>${review.rating === null ? 'Sin calificacion' : `${review.rating} / 5 estrellas`}</span>
      </div>
      <p>${escapeHtml(review.comment)}</p>
      <p class="review-meta">
        Reseña #${escapeHtml(review.id ?? 'N/A')} ·
        ${escapeHtml(review.adopterName)} ·
        ${escapeHtml(review.date)}
      </p>
    </li>
  `
}

export function renderReviewList(reviews) {
  return reviews.map(renderReviewCard).join('')
}
