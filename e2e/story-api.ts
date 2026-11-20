import type { Page } from '@playwright/test'

const apiBase = 'http://localhost:8080/api'

const defaultPets = [
  { id: 1, nombre: 'Mora', especie: 'Perro', raza: 'Criolla', edad: 2, estado: 'Disponible', refugio: { ciudad: 'Bogotá' } },
  { id: 2, nombre: 'Luna', especie: 'Gato', raza: 'Criolla', edad: 1, estado: 'Disponible', refugio: { ciudad: 'Bogotá' } },
]

type StoryApiOptions = {
  pets?: typeof defaultPets
  photos?: Record<number, Array<Record<string, unknown>>>
  events?: Record<number, Array<Record<string, unknown>>>
  stories?: Record<number, Array<Record<string, unknown>>>
  messages?: Array<Record<string, unknown>>
}

export async function mockStoryApi(page: Page, options: StoryApiOptions = {}) {
  const pets = options.pets ?? defaultPets
  const photos = options.photos ?? {
    1: [
      { id: 1, url: 'https://images.test/mora-1.jpg', descripcion: 'Retrato de Mora', principal: true, mascota: pets[0] },
      { id: 2, url: 'https://images.test/mora-2.jpg', descripcion: 'Mora juega', principal: false, mascota: pets[0] },
      { id: 3, url: 'https://images.test/mora-3.jpg', descripcion: 'Mora descansa', principal: false, mascota: pets[0] },
    ],
    2: [],
  }
  const events = options.events ?? {
    1: [
      { id: 11, mascotaId: 1, mascota: pets[0], tipo: 'Nacimiento', fecha: '2020-01-01', descripcion: 'Nació en el refugio.' },
      { id: 12, mascotaId: 1, mascota: pets[0], tipo: 'Vacunación', fecha: '2024-02-01', descripcion: 'Primera vacuna.' },
    ],
    2: [{ id: 13, mascotaId: 2, mascota: pets[1], tipo: 'Enfermedad', fecha: '2022-01-01', descripcion: 'Otro evento.' }],
  }
  const stories = options.stories ?? { 1: [], 2: [] }
  const messages = options.messages ?? []
  let nextId = 100

  await page.addInitScript(() => localStorage.setItem('huellitas.adoptanteId', '10'))
  await page.route(`${apiBase}/**`, async (route) => {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname.replace(/^\/api/, '')
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    const noContent = () => route.fulfill({ status: 204, body: '' })
    const notFound = () => json({ apierror: { message: 'El registro solicitado no existe.' } }, 404)

    if (path === '/mascotas' && method === 'GET') return json(pets)
    if (path === '/adopciones' && method === 'GET') return json([])
    if (path === '/retornos' && method === 'GET') return json([])

    const photoPath = path.match(/^\/mascotas\/(\d+)\/fotografias(?:\/(\d+)(\/activar)?)?$/)
    if (photoPath) {
      const petId = Number(photoPath[1])
      const pet = pets.find((item) => item.id === petId)
      const records = photos[petId] ?? (photos[petId] = [])
      const photoId = photoPath[2] ? Number(photoPath[2]) : null
      if (!pet) return notFound()
      if (!photoId && method === 'GET') return json(records)
      if (!photoId && method === 'POST') {
        const record = { ...request.postDataJSON(), id: nextId++, mascota: pet }
        records.push(record)
        return json(record, 201)
      }
      const index = records.findIndex((item) => item.id === photoId)
      if (index < 0) return notFound()
      if (photoPath[3] === '/activar' && method === 'PUT') {
        records.forEach((item) => { item.principal = item.id === photoId })
        return json(records[index])
      }
      if (method === 'PUT') {
        records[index] = { ...records[index], ...request.postDataJSON(), mascota: pet }
        return json(records[index])
      }
      if (method === 'DELETE') {
        records.splice(index, 1)
        return noContent()
      }
    }

    const eventPath = path.match(/^\/mascotas\/(\d+)\/eventos-vida(?:\/(\d+))?$/)
    if (eventPath) {
      const petId = Number(eventPath[1])
      const pet = pets.find((item) => item.id === petId)
      const records = events[petId] ?? (events[petId] = [])
      if (!pet) return notFound()
      if (!eventPath[2] && method === 'GET') return json(records)
      if (!eventPath[2] && method === 'POST') {
        const record = { ...request.postDataJSON(), id: nextId++, mascota: pet }
        records.push(record)
        return json(record, 201)
      }
      const index = records.findIndex((item) => item.id === Number(eventPath[2]))
      if (index < 0) return notFound()
      if (method === 'PUT') {
        records[index] = { ...records[index], ...request.postDataJSON(), mascota: pet }
        return json(records[index])
      }
      if (method === 'DELETE') {
        records.splice(index, 1)
        return noContent()
      }
    }

    const storyPath = path.match(/^\/mascotas\/(\d+)\/historias-exito(?:\/(\d+))?$/)
    if (storyPath) {
      const petId = Number(storyPath[1])
      const pet = pets.find((item) => item.id === petId)
      const records = stories[petId] ?? (stories[petId] = [])
      if (!pet) return notFound()
      if (!storyPath[2] && method === 'GET') return json(records)
      if (!storyPath[2] && method === 'POST') {
        const record = { ...request.postDataJSON(), id: nextId++, mascota: pet }
        records.push(record)
        return json(record, 201)
      }
      const index = records.findIndex((item) => item.id === Number(storyPath[2]))
      if (index < 0) return notFound()
      if (method === 'PUT') {
        records[index] = { ...records[index], ...request.postDataJSON(), mascota: pet }
        return json(records[index])
      }
      if (method === 'DELETE') {
        records.splice(index, 1)
        return noContent()
      }
    }

    const messagePath = path.match(/^\/adoptantes\/(\d+)\/mensajes(?:\/(\d+)(?:\/(leido|no-leido))?)?$/)
    if (messagePath) {
      const adopterId = Number(messagePath[1])
      const messageId = messagePath[2] ? Number(messagePath[2]) : null
      if (!messageId && method === 'GET') return json(messages.filter((item) => item.adoptanteId === adopterId))
      if (!messageId && method === 'POST') {
        const record = { ...request.postDataJSON(), id: nextId++, adoptanteId: adopterId }
        record.mascota = pets.find((pet) => pet.id === record.mascotaId)
        messages.push(record)
        return json(record, 201)
      }
      const index = messages.findIndex((item) => item.id === messageId && item.adoptanteId === adopterId)
      if (index < 0) return notFound()
      if (messagePath[3] && method === 'PATCH') {
        messages[index].leido = messagePath[3] === 'leido'
        return json(messages[index])
      }
      if (method === 'PUT') {
        messages[index] = { ...messages[index], ...request.postDataJSON() }
        messages[index].mascota = pets.find((pet) => pet.id === messages[index].mascotaId)
        return json(messages[index])
      }
      if (method === 'DELETE') {
        messages.splice(index, 1)
        return noContent()
      }
    }

    return notFound()
  })

  return { pets, photos, events, stories, messages }
}
