import { pets } from '../gallery.js'
import { isValidDate, PET_HISTORY_STORAGE_KEY, readCollection } from './storage.js'

export const EVENTS_STORAGE_KEY = 'huellitas.lifeEvents'
export const EVENT_TYPES = ['Nacimiento', 'Vacunación', 'Enfermedad', 'Adopción', 'Muerte']

const clean = (value) => typeof value === 'string' ? value.trim() : ''
const petById = (petId) => pets.find((pet) => pet.id === petId)

export function getEvents(storage, petId) {
  const events = readCollection(storage, EVENTS_STORAGE_KEY)
  return petId ? events.filter((event) => event.petId === petId) : events
}

export function validateEvent(values, today = new Date().toISOString().slice(0, 10)) {
  const errors = {}
  const petId = clean(values.petId)
  const date = clean(values.date)
  if (!petId) errors.petId = 'Selecciona una mascota.'
  else if (!petById(petId)) errors.petId = 'La mascota seleccionada no existe.'
  if (!EVENT_TYPES.includes(clean(values.type))) errors.type = 'Selecciona un tipo de evento permitido.'
  if (!isValidDate(date)) errors.date = 'Ingresa una fecha válida.'
  else if (date > today) errors.date = 'La fecha del evento no puede ser futura.'
  if (!clean(values.description)) errors.description = 'Describe el evento.'
  return errors
}

export function createEvent(values, {
  id = globalThis.crypto.randomUUID(),
  createdAt = new Date().toISOString(),
} = {}) {
  const pet = petById(clean(values.petId))
  return {
    id,
    petId: pet.id,
    petName: pet.name,
    type: clean(values.type),
    date: clean(values.date),
    description: clean(values.description),
    createdAt,
  }
}

export function saveEvent(storage, event) {
  const events = getEvents(storage)
  if (events.some((item) => item.id === event.id)) throw new Error('El evento ya está registrado.')
  events.push(event)
  storage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
  const history = readCollection(storage, PET_HISTORY_STORAGE_KEY)
  history.push({
    type: event.type,
    eventId: event.id,
    petId: event.petId,
    petName: event.petName,
    date: event.date,
    description: event.description,
  })
  storage.setItem(PET_HISTORY_STORAGE_KEY, JSON.stringify(history))
}

export function updateEvent(storage, eventId, values, today = new Date().toISOString().slice(0, 10)) {
  const events = getEvents(storage)
  const event = events.find((item) => item.id === eventId)
  if (!event) throw new Error('No encontramos el evento que quieres editar.')
  const errors = validateEvent(values, today)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const pet = petById(clean(values.petId))
  const previousPetName = event.petName
  Object.assign(event, {
    petId: pet.id,
    petName: pet.name,
    type: clean(values.type),
    date: clean(values.date),
    description: clean(values.description),
  })
  storage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
  const history = readCollection(storage, PET_HISTORY_STORAGE_KEY)
  const historyEvent = history.find((item) => item.eventId === eventId)
  if (historyEvent) {
    Object.assign(historyEvent, {
      type: event.type,
      petId: event.petId,
      petName: event.petName,
      date: event.date,
      description: event.description,
    })
    storage.setItem(PET_HISTORY_STORAGE_KEY, JSON.stringify(history))
  } else if (previousPetName !== event.petName) {
    history.push({ type: event.type, eventId: event.id, petId: event.petId, petName: event.petName, date: event.date, description: event.description })
    storage.setItem(PET_HISTORY_STORAGE_KEY, JSON.stringify(history))
  }
  return event
}