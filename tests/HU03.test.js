import { describe, expect, it } from 'vitest'
import {
  createEvent,
  EVENTS_STORAGE_KEY,
  EVENT_TYPES,
  getEvents,
  saveEvent,
  updateEvent,
  validateEvent,
} from '../src/workflows/HU03.js'
import { PET_HISTORY_STORAGE_KEY } from '../src/workflows/storage.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

const values = { petId: 'mora', type: 'Vacunación', date: '2026-10-25', description: 'Primera dosis' }

describe('HU03 life events', () => {
  it('lists all events or just those belonging to a pet', () => {
    const storage = memoryStorage({ [EVENTS_STORAGE_KEY]: JSON.stringify([
      { id: 'one', petId: 'mora' }, { id: 'two', petId: 'luna' },
    ]) })
    expect(getEvents(storage)).toHaveLength(2)
    expect(getEvents(storage, 'mora')).toEqual([{ id: 'one', petId: 'mora' }])
    expect(getEvents(memoryStorage())).toEqual([])
  })

  it('validates required fields, allowed type, real past date and description', () => {
    expect(validateEvent({}, '2026-10-29')).toMatchObject({
      petId: 'Selecciona una mascota.',
      type: 'Selecciona un tipo de evento permitido.',
      date: 'Ingresa una fecha válida.',
      description: 'Describe el evento.',
    })
    expect(validateEvent({ ...values, petId: 'missing', type: 'Otro' }, '2026-10-29')).toMatchObject({
      petId: 'La mascota seleccionada no existe.',
      type: 'Selecciona un tipo de evento permitido.',
    })
    expect(validateEvent({ ...values, date: '2026-11-01' }, '2026-10-29').date).toBe('La fecha del evento no puede ser futura.')
    expect(validateEvent(values, '2026-10-29')).toEqual({})
    expect(EVENT_TYPES).toContain('Muerte')
  })

  it('creates a normalized event with generated identity', () => {
    expect(createEvent({ ...values, description: ' Evento ' }, { id: 'event-1', createdAt: 'stamp' })).toEqual({
      id: 'event-1', petId: 'mora', petName: 'Mora', type: 'Vacunación', date: '2026-10-25',
      description: 'Evento', createdAt: 'stamp',
    })
  })

  it('saves an event and rejects duplicate ids', () => {
    const storage = memoryStorage()
    const event = createEvent(values, { id: 'event-1' })
    saveEvent(storage, event)
    expect(getEvents(storage)).toEqual([event])
    expect(JSON.parse(storage.getItem(PET_HISTORY_STORAGE_KEY))).toMatchObject([
      { type: 'Vacunación', eventId: 'event-1', petId: 'mora', petName: 'Mora', date: '2026-10-25' },
    ])
    expect(() => saveEvent(storage, event)).toThrow('El evento ya está registrado.')
  })

  it('edits an existing event and rejects missing event or pet', () => {
    const storage = memoryStorage({ [EVENTS_STORAGE_KEY]: JSON.stringify([createEvent(values, { id: 'event-1' })]) })
    const edited = updateEvent(storage, 'event-1', { ...values, petId: 'luna', description: 'Cambio' })
    expect(edited).toMatchObject({ petId: 'luna', petName: 'Luna', description: 'Cambio' })
    expect(JSON.parse(storage.getItem(PET_HISTORY_STORAGE_KEY))).toMatchObject([
      { eventId: 'event-1', petName: 'Luna', description: 'Cambio' },
    ])
    expect(() => updateEvent(storage, 'missing', values)).toThrow('No encontramos el evento que quieres editar.')
    expect(() => updateEvent(storage, 'event-1', { ...values, petId: 'unknown' })).toThrow('La mascota seleccionada no existe.')
    expect(() => updateEvent(storage, 'event-1', { ...values, date: '2099-12-31' }, '2026-10-29'))
      .toThrow('La fecha del evento no puede ser futura.')
  })

  it('updates the shared history event and edits without changing a pet when no history entry exists', () => {
    const event = createEvent(values, { id: 'history-event' })
    const historyStorage = memoryStorage({
      [EVENTS_STORAGE_KEY]: JSON.stringify([event]),
      [PET_HISTORY_STORAGE_KEY]: JSON.stringify([{ eventId: event.id, petName: 'Mora', type: 'Vacunación' }]),
    })
    updateEvent(historyStorage, event.id, { ...values, description: 'Actualizado' })
    expect(JSON.parse(historyStorage.getItem(PET_HISTORY_STORAGE_KEY))[0]).toMatchObject({ description: 'Actualizado' })

    const noHistoryStorage = memoryStorage({ [EVENTS_STORAGE_KEY]: JSON.stringify([event]) })
    updateEvent(noHistoryStorage, event.id, { ...values, description: 'Sin cambio de mascota' })
    expect(noHistoryStorage.getItem(PET_HISTORY_STORAGE_KEY)).toBeNull()
  })
})
