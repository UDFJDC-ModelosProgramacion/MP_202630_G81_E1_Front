import { describe, expect, it, vi } from 'vitest'
import {
  createAdopterMessage,
  createLifeEvent,
  createPhoto,
  createSuccessStory,
  deleteAdopterMessage,
  deleteLifeEvent,
  deletePhoto,
  deleteSuccessStory,
  listAdopterMessages,
  listLifeEvents,
  listPets,
  listPhotos,
  listSuccessStories,
  listTimelineEvents,
  normalizeAdopterMessage,
  normalizeLifeEvent,
  normalizePhoto,
  normalizeStoryPet,
  normalizeSuccessStory,
  setAdopterMessageRead,
  setPrincipalPhoto,
  updateAdopterMessage,
  updateLifeEvent,
  updatePhoto,
  updateSuccessStory,
} from '../src/workflows/story-api.js'

const API = 'http://api.test/api'
const options = (fetchFn) => ({ apiUrl: API, fetchFn })
const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => data === undefined ? '' : JSON.stringify(data),
})

describe('backend data normalization', () => {
  it('maps API pets and nested records into page models', () => {
    expect(normalizeStoryPet({
      id: 8, nombre: ' Mora ', especie: 'Perro', raza: 'Criolla', edad: 2,
      estado: 'Disponible', refugio: { ciudad: 'Bogotá' },
    })).toMatchObject({ id: 8, name: 'Mora', breed: 'Criolla', location: 'Bogotá' })
    expect(normalizePhoto({ id: 2, url: 'https://x.test/a.jpg', descripcion: 'Retrato', principal: true, mascota: { id: 8, nombre: 'Mora' } }))
      .toEqual({ id: 2, petId: 8, petName: 'Mora', url: 'https://x.test/a.jpg', description: 'Retrato', principal: true })
    expect(normalizeLifeEvent({ id: 3, tipo: 'Nacimiento', fecha: '2024-01-01', descripcion: 'Nació', mascotaId: 8 }))
      .toMatchObject({ id: 3, petId: 8, type: 'Nacimiento', date: '2024-01-01' })
    expect(normalizeSuccessStory({ id: 4, titulo: 'Nuevo hogar', descripcion: 'Final feliz', fecha: '2025-01-01', mascota: { id: 8 } }))
      .toMatchObject({ id: 4, petId: 8, title: 'Nuevo hogar', createdAt: '2025-01-01' })
    expect(normalizeAdopterMessage({ id: 5, asunto: 'Hola', contenido: 'Consulta', fecha: '2025-01-01', leido: true, mascotaId: 8, adoptanteId: 10 }))
      .toMatchObject({ id: 5, petId: 8, adopterId: 10, subject: 'Hola', read: true })
  })

  it('uses safe defaults when the API omits optional relationship and display fields', () => {
    expect(normalizeStoryPet({ edad: -1, nombre: '', especie: null, refugio: null }))
      .toMatchObject({ id: null, name: 'Mascota sin nombre', species: 'Especie no registrada', age: null, location: '', status: 'Disponible' })
    expect(normalizePhoto({ id: null, mascota: null, mascotaId: 7, url: '', descripcion: '', principal: false }))
      .toMatchObject({ id: null, petId: 7, petName: 'Mascota', url: '', description: '', principal: false })
    expect(normalizePhoto({ mascotaId: null })).toMatchObject({ petId: null })
    expect(normalizeLifeEvent({ mascota: { id: 7, nombre: '' }, mascotaId: 2, tipo: '', fecha: null, descripcion: '' }))
      .toMatchObject({ petId: 7, petName: 'Mascota', type: '', date: '', description: '' })
    expect(normalizeLifeEvent({ mascotaId: 7 })).toMatchObject({ petId: 7 })
    expect(normalizeLifeEvent({})).toMatchObject({ petId: null })
    expect(normalizeSuccessStory({ mascotaId: 7 })).toMatchObject({ petId: 7, petName: 'Mascota', title: '', description: '' })
    expect(normalizeSuccessStory({})).toMatchObject({ petId: null })
    expect(normalizeAdopterMessage({ adoptante: { id: 10 }, mascota: { id: 7 }, asunto: '', contenido: '', leido: false }))
      .toMatchObject({ adopterId: 10, petId: 7, petName: 'Sin mascota relacionada', read: false })
    expect(normalizeAdopterMessage({ adoptanteId: 10, mascotaId: 7 })).toMatchObject({ adopterId: 10, petId: 7 })
    expect(normalizeAdopterMessage({})).toMatchObject({ adopterId: null, petId: null })
  })

  it('surfaces malformed collections and backend errors', async () => {
    const malformed = vi.fn().mockResolvedValue(response({ id: 1 }))
    await expect(listPets(options(malformed))).resolves.toMatchObject({
      ok: false, message: 'El servidor respondió con un formato inesperado.',
    })
    const failed = vi.fn().mockResolvedValue(response({ apierror: { message: 'Sin conexión con mascotas' } }, 503))
    await expect(listPets(options(failed))).resolves.toMatchObject({ ok: false, message: 'Sin conexión con mascotas' })
  })
})

describe('story resource endpoints', () => {
  it('loads the pet list and all child collections from their API paths', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(response([{ id: 8, nombre: 'Mora' }]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]))
    await listPets(options(fetchFn))
    await listPhotos(8, options(fetchFn))
    await listLifeEvents(8, options(fetchFn))
    await listSuccessStories(8, options(fetchFn))
    await listAdopterMessages(10, options(fetchFn))
    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual([
      `${API}/mascotas`,
      `${API}/mascotas/8/fotografias`,
      `${API}/mascotas/8/eventos-vida`,
      `${API}/mascotas/8/historias-exito`,
      `${API}/adoptantes/10/mensajes`,
    ])
  })

  it('combines life events, adoptions and returns for the selected pet', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(response([
        { id: 2, tipo: 'Nacimiento', fecha: '2021-01-01', mascota: { id: 8 } },
        { id: 20, tipo: 'Nacimiento', fecha: '2021-01-01', mascota: { id: 9 } },
      ]))
      .mockResolvedValueOnce(response([{ id: 3, fechaAdopcion: '2022-01-01', solicitud: { mascota: { id: 8, nombre: 'Mora' } } }]))
      .mockResolvedValueOnce(response([{ id: 4, fecha: '2023-01-01', motivo: 'Cambio', adopcion: { solicitud: { mascota: { id: 8, nombre: 'Mora' } } } }]))
    const result = await listTimelineEvents(8, options(fetchFn))
    expect(result.events.map((event) => event.type)).toEqual(['Nacimiento', 'Adopción', 'Retorno'])
    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual([
      `${API}/mascotas/8/eventos-vida`, `${API}/adopciones`, `${API}/retornos`,
    ])
  })

  it('returns the first failed collection when timeline data cannot be loaded', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(response([], 503))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]))
    await expect(listTimelineEvents(8, options(fetchFn))).resolves.toMatchObject({ ok: false })
  })

  it('normalizes adoption and return records without optional details', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: 1 }]))
      .mockResolvedValueOnce(response([{ id: 2, descripcion: '', motivo: '', adopcion: null }]))
    const result = await listTimelineEvents(8, options(fetchFn))
    expect(result.events).toEqual([])
  })

  it('creates, updates, activates and deletes a photo using the backend contract', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ id: 12 }))
    const values = { url: ' https://x.test/a.jpg ', description: ' Retrato ', principal: true }
    await createPhoto(8, values, options(fetchFn))
    await updatePhoto(8, 12, values, options(fetchFn))
    await setPrincipalPhoto(8, 12, options(fetchFn))
    fetchFn.mockResolvedValue(response(undefined, 204))
    await deletePhoto(8, 12, options(fetchFn))
    expect(fetchFn.mock.calls.slice(0, 3).map(([url, request]) => [url, request.method])).toEqual([
      [`${API}/mascotas/8/fotografias`, 'POST'],
      [`${API}/mascotas/8/fotografias/12`, 'PUT'],
      [`${API}/mascotas/8/fotografias/12/activar`, 'PUT'],
    ])
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({
      url: 'https://x.test/a.jpg', descripcion: 'Retrato', principal: true, mascotaId: 8,
    })
    expect(fetchFn.mock.calls[3][0]).toBe(`${API}/mascotas/8/fotografias/12`)
    expect(fetchFn.mock.calls[3][1].method).toBe('DELETE')
  })

  it('returns backend delete errors without hiding them', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({}, 500))
    await expect(deletePhoto(8, 12, options(fetchFn))).resolves.toMatchObject({ ok: false })
    await expect(deleteLifeEvent(8, 12, options(fetchFn))).resolves.toMatchObject({ ok: false })
    await expect(deleteSuccessStory(8, 12, options(fetchFn))).resolves.toMatchObject({ ok: false })
    await expect(deleteAdopterMessage(10, 12, options(fetchFn))).resolves.toMatchObject({ ok: false })
  })

  it('creates, updates and deletes life events and success stories', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ id: 4 }))
    const event = { type: 'Nacimiento', date: '2024-01-01', description: 'Nació' }
    await createLifeEvent(8, event, options(fetchFn))
    await updateLifeEvent(8, 4, event, options(fetchFn))
    await deleteLifeEvent(8, 4, options(fetchFn))
    const story = { title: 'Nuevo hogar', description: 'Final feliz', date: '2025-01-01' }
    await createSuccessStory(8, story, options(fetchFn))
    await updateSuccessStory(8, 9, story, options(fetchFn))
    await deleteSuccessStory(8, 9, options(fetchFn))
    expect(fetchFn.mock.calls.map(([url, request]) => [url, request.method])).toEqual([
      [`${API}/mascotas/8/eventos-vida`, 'POST'],
      [`${API}/mascotas/8/eventos-vida/4`, 'PUT'],
      [`${API}/mascotas/8/eventos-vida/4`, 'DELETE'],
      [`${API}/mascotas/8/historias-exito`, 'POST'],
      [`${API}/mascotas/8/historias-exito/9`, 'PUT'],
      [`${API}/mascotas/8/historias-exito/9`, 'DELETE'],
    ])
  })

  it('creates, updates, changes read status and deletes adopter messages', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ id: 14 }))
    const values = {
      date: '2025-03-01', subject: 'Consulta', content: 'Hola', read: false, petId: '8',
    }
    await createAdopterMessage(10, values, options(fetchFn))
    await updateAdopterMessage(10, 14, values, options(fetchFn))
    await setAdopterMessageRead(10, 14, true, options(fetchFn))
    await setAdopterMessageRead(10, 14, false, options(fetchFn))
    fetchFn.mockResolvedValue(response(undefined, 204))
    await deleteAdopterMessage(10, 14, options(fetchFn))
    expect(fetchFn.mock.calls.map(([url, request]) => [url, request.method])).toEqual([
      [`${API}/adoptantes/10/mensajes`, 'POST'],
      [`${API}/adoptantes/10/mensajes/14`, 'PUT'],
      [`${API}/adoptantes/10/mensajes/14/leido`, 'PATCH'],
      [`${API}/adoptantes/10/mensajes/14/no-leido`, 'PATCH'],
      [`${API}/adoptantes/10/mensajes/14`, 'DELETE'],
    ])
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({
      fecha: '2025-03-01', asunto: 'Consulta', contenido: 'Hola', leido: false, mascotaId: 8, adoptanteId: 10,
    })
    fetchFn.mockResolvedValue(response({ id: 15 }))
    await createAdopterMessage(10, { ...values, petId: '' }, options(fetchFn))
    expect(JSON.parse(fetchFn.mock.calls[5][1].body).mascotaId).toBeNull()
  })
})
