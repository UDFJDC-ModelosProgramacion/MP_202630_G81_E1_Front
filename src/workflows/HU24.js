export const DEFAULT_API_URL = 'http://localhost:8080/api'

export class ResenaError extends Error {
  constructor(message, { status = null } = {}) {
    super(message)
    this.name = 'ResenaError'
    this.status = status
  }
}

export function getApiUrl(env = {}) {
  const configured = typeof env.VITE_API_URL === 'string' ? env.VITE_API_URL.trim() : ''
  return (configured || DEFAULT_API_URL).replace(/\/+$/, '')
}

export function validateReview(values = {}) {
  const errors = {}
  const rating = Number(values.calificacion)
  const comment = typeof values.comentario === 'string' ? values.comentario.trim() : ''
  const date = typeof values.fecha === 'string' ? values.fecha.trim() : ''
  const petId = Number(values.mascotaId)
  const adopterId = typeof values.adoptanteId === 'string'
    ? values.adoptanteId.trim()
    : String(values.adoptanteId ?? '').trim()

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.calificacion = 'La calificación debe estar entre 1 y 5.'
  }

  if (!comment) {
    errors.comentario = 'Escribe un comentario para la reseña.'
  }

  if (!date || Number.isNaN(Date.parse(date))) {
    errors.fecha = 'Selecciona una fecha válida.'
  }

  if (!Number.isInteger(petId) || petId <= 0) {
    errors.mascotaId = 'Selecciona una mascota válida.'
  }

  if (adopterId && (!Number.isInteger(Number(adopterId)) || Number(adopterId) <= 0)) {
    errors.adoptanteId = 'Selecciona un adoptante válido.'
  }

  return errors
}

export function buildReviewPayload(values) {
  const adopterId = typeof values.adoptanteId === 'string'
    ? values.adoptanteId.trim()
    : String(values.adoptanteId ?? '').trim()

  return {
    calificacion: Number(values.calificacion),
    comentario: values.comentario.trim(),
    fecha: values.fecha,
    mascota: {
      id: Number(values.mascotaId),
    },
    adoptante: adopterId ? { id: Number(adopterId) } : null,
  }
}

async function readResponse(response) {
  let data = null

  try {
    data = await response.json()
  } catch {
    if (response.ok) {
      return null
    }
  }

  if (!response.ok) {
    const message = data?.apiError?.message
      || data?.message
      || 'No fue posible completar la operación.'

    throw new ResenaError(message, { status: response.status })
  }

  return data
}

async function request(fetchFn, url, options = {}) {
  let response

  try {
    response = await fetchFn(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ResenaError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  }

  return readResponse(response)
}

async function fetchCollection(fetchFn, url, label) {
  const data = await request(fetchFn, url)

  if (!Array.isArray(data)) {
    throw new ResenaError(`El servidor respondió con un formato inesperado al consultar ${label}.`)
  }

  return data
}

function safeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function normalizePet(raw) {
  return {
    id: raw.id ?? null,
    name: safeText(raw.nombre, 'Mascota sin nombre'),
    species: safeText(raw.especie, 'Especie no registrada'),
  }
}

export function normalizeAdopter(raw) {
  const fullName = [raw.nombre, raw.apellido, raw.apellidos]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')

  return {
    id: raw.id ?? null,
    name: safeText(fullName, safeText(raw.nombreCompleto, `Adoptante ${raw.id ?? ''}`)),
  }
}

export function normalizeReview(raw) {
  return {
    id: raw.id ?? null,
    rating: raw.calificacion ?? null,
    comment: safeText(raw.comentario),
    date: safeText(raw.fecha),
    petId: raw.mascota?.id ?? raw.mascotaId ?? null,
    petName: safeText(raw.mascota?.nombre, 'Mascota'),
    adopterId: raw.adoptante?.id ?? raw.adoptanteId ?? null,
    adopterName: raw.adoptante
      ? safeText(
        [raw.adoptante.nombre, raw.adoptante.apellido, raw.adoptante.apellidos]
          .filter((value) => typeof value === 'string' && value.trim())
          .join(' '),
        'Adoptante',
      )
      : 'No especificado',
  }
}

export async function fetchPets(fetchFn = fetch, apiUrl = DEFAULT_API_URL) {
  const data = await fetchCollection(fetchFn, `${apiUrl}/mascotas`, 'las mascotas')
  return data.map(normalizePet)
}

export async function fetchAdopters(fetchFn = fetch, apiUrl = DEFAULT_API_URL) {
  const data = await fetchCollection(fetchFn, `${apiUrl}/adoptantes`, 'los adoptantes')
  return data.map(normalizeAdopter)
}

export async function fetchReviews(fetchFn = fetch, apiUrl = DEFAULT_API_URL) {
  const data = await fetchCollection(fetchFn, `${apiUrl}/resenas`, 'las reseñas')
  return data.map(normalizeReview)
}

export async function createReview(values, fetchFn = fetch, apiUrl = DEFAULT_API_URL) {
  const errors = validateReview(values)

  if (Object.keys(errors).length > 0) {
    throw new ResenaError(Object.values(errors)[0])
  }

  return request(fetchFn, `${apiUrl}/resenas`, {
    method: 'POST',
    body: JSON.stringify(buildReviewPayload(values)),
  })
}

export async function updateReview(id, values, fetchFn = fetch, apiUrl = DEFAULT_API_URL) {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw new ResenaError('Selecciona una reseña válida.')
  }

  const errors = validateReview(values)

  if (Object.keys(errors).length > 0) {
    throw new ResenaError(Object.values(errors)[0])
  }

  return request(fetchFn, `${apiUrl}/resenas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(buildReviewPayload(values)),
  })
}