import { pets } from '../gallery.js'
import { PET_HISTORY_STORAGE_KEY, readCollection } from './storage.js'
import { EVENTS_STORAGE_KEY } from './HU03.js'

export const TIMELINE_TYPES = ['Todos', 'Nacimiento', 'Vacunación', 'Enfermedad', 'Adopción', 'Muerte', 'Retorno']

const knownTypes = new Set(TIMELINE_TYPES.slice(1))

function normalizeHistoryEvent(event) {
  const type = knownTypes.has(event.type) ? event.type : 'Adopción'
  return {
    ...event,
    type,
    date: event.date ?? event.adoptionDate ?? event.returnDate ?? '',
    description: event.description ?? `${event.type} registrada en el historial.`,
  }
}

export function getTimeline(storage, petId) {
  const pet = pets.find((item) => item.id === petId)
  if (!pet) return { status: 'not-found', pet: null, events: [] }

  const lifeEvents = readCollection(storage, EVENTS_STORAGE_KEY)
    .filter((event) => event.petId === petId)
  const history = readCollection(storage, PET_HISTORY_STORAGE_KEY)
    .filter((event) => event.petName === pet.name)
    .map(normalizeHistoryEvent)

  return {
    status: 'available',
    pet,
    events: [...lifeEvents, ...history].sort((first, second) => {
      if (!first.date) return 1
      if (!second.date) return -1
      return first.date.localeCompare(second.date)
    }),
  }
}

export function filterTimeline(events, { type = 'Todos', from = '', to = '' } = {}) {
  return events.filter((event) => {
    if (type !== 'Todos' && event.type !== type) return false
    if (from && event.date < from) return false
    if (to && event.date >= to) return false
    return true
  })
}

export function validateTimelineFilters({ from = '', to = '' }) {
  if (from && to && from > to) return 'La fecha inicial no puede ser posterior a la fecha final.'
  return ''
}