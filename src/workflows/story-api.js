import { apiRequest, withData } from '../api/client.js'

function collectionResult(result, key, normalize) {
  if (!result.ok) return result
  if (!Array.isArray(result[key])) {
    return { ok: false, message: 'El servidor respondió con un formato inesperado.' }
  }
  return { ok: true, [key]: result[key].map(normalize) }
}

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function dateOnly(value) {
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

export function normalizeStoryPet(raw) {
  return {
    id: raw.id ?? null,
    name: text(raw.nombre, 'Mascota sin nombre'),
    species: text(raw.especie, 'Especie no registrada'),
    breed: text(raw.raza, 'Raza no registrada'),
    age: Number.isInteger(raw.edad) && raw.edad >= 0 ? raw.edad : null,
    location: text(raw.refugio?.ciudad),
    status: text(raw.estado, 'Disponible'),
  }
}

export function normalizePhoto(raw) {
  return {
    id: raw.id ?? null,
    petId: raw.mascota?.id ?? raw.mascotaId ?? null,
    petName: text(raw.mascota?.nombre, 'Mascota'),
    url: text(raw.url),
    description: text(raw.descripcion),
    principal: Boolean(raw.principal),
  }
}

export function normalizeLifeEvent(raw) {
  return {
    id: raw.id ?? null,
    petId: raw.mascota?.id ?? raw.mascotaId ?? null,
    petName: text(raw.mascota?.nombre, 'Mascota'),
    type: text(raw.tipo),
    date: dateOnly(raw.fecha),
    description: text(raw.descripcion),
  }
}

export function normalizeSuccessStory(raw) {
  return {
    id: raw.id ?? null,
    petId: raw.mascota?.id ?? raw.mascotaId ?? null,
    petName: text(raw.mascota?.nombre, 'Mascota'),
    title: text(raw.titulo),
    description: text(raw.descripcion),
    createdAt: dateOnly(raw.fecha),
  }
}

export function normalizeAdopterMessage(raw) {
  return {
    id: raw.id ?? null,
    adopterId: raw.adoptante?.id ?? raw.adoptanteId ?? null,
    petId: raw.mascota?.id ?? raw.mascotaId ?? null,
    petName: text(raw.mascota?.nombre, 'Sin mascota relacionada'),
    subject: text(raw.asunto),
    content: text(raw.contenido),
    createdAt: dateOnly(raw.fecha),
    read: Boolean(raw.leido),
  }
}

function normalizeAdoptionEvent(raw) {
  const pet = raw.solicitud?.mascota ?? {}
  return {
    id: `adopcion-${raw.id}`,
    petId: pet.id ?? null,
    petName: text(pet.nombre, 'Mascota'),
    type: 'Adopción',
    date: dateOnly(raw.fechaAdopcion),
    description: text(raw.observacion, 'Adopción registrada en el historial.'),
  }
}

function normalizeReturnEvent(raw) {
  const pet = raw.adopcion?.solicitud?.mascota ?? {}
  return {
    id: `retorno-${raw.id}`,
    petId: pet.id ?? null,
    petName: text(pet.nombre, 'Mascota'),
    type: 'Retorno',
    date: dateOnly(raw.fecha),
    description: text(raw.descripcion, text(raw.motivo, 'Retorno registrado en el historial.')),
  }
}

export async function listPets(options) {
  const result = withData(await apiRequest('/mascotas', options), 'pets')
  return collectionResult(result, 'pets', normalizeStoryPet)
}

async function listCollection(path, key, normalize, options) {
  return collectionResult(withData(await apiRequest(path, options), key), key, normalize)
}

function petPath(petId, resource) {
  return `/mascotas/${encodeURIComponent(petId)}/${resource}`
}

function adopterPath(adopterId) {
  return `/adoptantes/${encodeURIComponent(adopterId)}/mensajes`
}

export function listPhotos(petId, options) {
  return listCollection(petPath(petId, 'fotografias'), 'photos', normalizePhoto, options)
}

export async function createPhoto(petId, values, options) {
  return withData(await apiRequest(petPath(petId, 'fotografias'), {
    ...options,
    method: 'POST',
    body: {
      url: values.url.trim(),
      descripcion: values.description.trim(),
      principal: Boolean(values.principal),
      mascotaId: Number(petId),
    },
  }), 'photo')
}

export async function updatePhoto(petId, photoId, values, options) {
  return withData(await apiRequest(`${petPath(petId, 'fotografias')}/${encodeURIComponent(photoId)}`, {
    ...options,
    method: 'PUT',
    body: {
      url: values.url.trim(),
      descripcion: values.description.trim(),
      principal: Boolean(values.principal),
      mascotaId: Number(petId),
    },
  }), 'photo')
}

export async function setPrincipalPhoto(petId, photoId, options) {
  return withData(await apiRequest(
    `${petPath(petId, 'fotografias')}/${encodeURIComponent(photoId)}/activar`,
    { ...options, method: 'PUT' },
  ), 'photo')
}

export async function deletePhoto(petId, photoId, options) {
  const result = await apiRequest(
    `${petPath(petId, 'fotografias')}/${encodeURIComponent(photoId)}`,
    { ...options, method: 'DELETE' },
  )
  return result.ok ? { ok: true } : result
}

export function listLifeEvents(petId, options) {
  return listCollection(petPath(petId, 'eventos-vida'), 'events', normalizeLifeEvent, options)
}

export async function listTimelineEvents(petId, options) {
  const [lifeEvents, adoptions, returns] = await Promise.all([
    listLifeEvents(petId, options),
    listCollection('/adopciones', 'adoptions', normalizeAdoptionEvent, options),
    listCollection('/retornos', 'returns', normalizeReturnEvent, options),
  ])
  const failed = [lifeEvents, adoptions, returns].find((result) => !result.ok)
  if (failed) return failed
  const petEvents = [...lifeEvents.events, ...adoptions.adoptions, ...returns.returns]
    .filter((event) => String(event.petId) === String(petId))
  return { ok: true, events: petEvents }
}

function lifeEventPayload(petId, values) {
  return {
    tipo: values.type.trim(),
    fecha: values.date,
    descripcion: values.description.trim(),
    mascotaId: Number(petId),
  }
}

export async function createLifeEvent(petId, values, options) {
  return withData(await apiRequest(petPath(petId, 'eventos-vida'), {
    ...options,
    method: 'POST',
    body: lifeEventPayload(petId, values),
  }), 'event')
}

export async function updateLifeEvent(petId, eventId, values, options) {
  return withData(await apiRequest(`${petPath(petId, 'eventos-vida')}/${encodeURIComponent(eventId)}`, {
    ...options,
    method: 'PUT',
    body: lifeEventPayload(petId, values),
  }), 'event')
}

export async function deleteLifeEvent(petId, eventId, options) {
  const result = await apiRequest(`${petPath(petId, 'eventos-vida')}/${encodeURIComponent(eventId)}`, {
    ...options,
    method: 'DELETE',
  })
  return result.ok ? { ok: true } : result
}

export function listSuccessStories(petId, options) {
  return listCollection(petPath(petId, 'historias-exito'), 'stories', normalizeSuccessStory, options)
}

function successStoryPayload(petId, values) {
  return {
    titulo: values.title.trim(),
    descripcion: values.description.trim(),
    fecha: values.date,
    mascotaId: Number(petId),
  }
}

export async function createSuccessStory(petId, values, options) {
  return withData(await apiRequest(petPath(petId, 'historias-exito'), {
    ...options,
    method: 'POST',
    body: successStoryPayload(petId, values),
  }), 'story')
}

export async function updateSuccessStory(petId, storyId, values, options) {
  return withData(await apiRequest(`${petPath(petId, 'historias-exito')}/${encodeURIComponent(storyId)}`, {
    ...options,
    method: 'PUT',
    body: successStoryPayload(petId, values),
  }), 'story')
}

export async function deleteSuccessStory(petId, storyId, options) {
  const result = await apiRequest(`${petPath(petId, 'historias-exito')}/${encodeURIComponent(storyId)}`, {
    ...options,
    method: 'DELETE',
  })
  return result.ok ? { ok: true } : result
}

export function listAdopterMessages(adopterId, options) {
  return listCollection(adopterPath(adopterId), 'messages', normalizeAdopterMessage, options)
}

function messagePayload(adopterId, values) {
  return {
    fecha: values.date,
    asunto: values.subject.trim(),
    contenido: values.content.trim(),
    leido: Boolean(values.read),
    mascotaId: values.petId ? Number(values.petId) : null,
    adoptanteId: Number(adopterId),
  }
}

export async function createAdopterMessage(adopterId, values, options) {
  return withData(await apiRequest(adopterPath(adopterId), {
    ...options,
    method: 'POST',
    body: messagePayload(adopterId, values),
  }), 'message')
}

export async function updateAdopterMessage(adopterId, messageId, values, options) {
  return withData(await apiRequest(`${adopterPath(adopterId)}/${encodeURIComponent(messageId)}`, {
    ...options,
    method: 'PUT',
    body: messagePayload(adopterId, values),
  }), 'message')
}

export async function setAdopterMessageRead(adopterId, messageId, read, options) {
  const action = read ? 'leido' : 'no-leido'
  return withData(await apiRequest(`${adopterPath(adopterId)}/${encodeURIComponent(messageId)}/${action}`, {
    ...options,
    method: 'PATCH',
  }), 'message')
}

export async function deleteAdopterMessage(adopterId, messageId, options) {
  const result = await apiRequest(`${adopterPath(adopterId)}/${encodeURIComponent(messageId)}`, {
    ...options,
    method: 'DELETE',
  })
  return result.ok ? { ok: true } : result
}
