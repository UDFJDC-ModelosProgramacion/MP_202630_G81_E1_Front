import { describe, expect, it } from 'vitest'
import { EVENTS_STORAGE_KEY } from '../src/workflows/HU03.js'
import { filterTimeline, getTimeline, TIMELINE_TYPES, validateTimelineFilters } from '../src/workflows/HU04.js'
import { PET_HISTORY_STORAGE_KEY } from '../src/workflows/storage.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

describe('HU04 life timeline', () => {
  it('reports an unknown pet and merges/sorts event and adoption history', () => {
    const storage = memoryStorage({
      [EVENTS_STORAGE_KEY]: JSON.stringify([
        { id: 'vaccination', petId: 'mora', type: 'Vacunación', date: '2024-02-01', description: 'Vacuna' },
        { id: 'other', petId: 'luna', type: 'Nacimiento', date: '2020-01-01', description: 'Nacimiento' },
        { id: 'undated', petId: 'mora', type: 'Enfermedad', date: '', description: 'Fecha pendiente' },
      ]),
      [PET_HISTORY_STORAGE_KEY]: JSON.stringify([
        { type: 'Adopción', petName: 'Mora', date: '2024-03-01', adoptionId: 'adoption-1' },
        { type: 'Retorno', petName: 'Mora', date: '2024-04-01', description: 'Retorno registrado' },
        { type: 'Vacunación', petName: 'Mora', date: '2024-05-01', description: 'Vacuna del historial compartido' },
        { type: 'Desconocido', petName: 'Mora', adoptionDate: '2024-06-01' },
        { type: 'Adopción', petName: 'Mora', returnDate: '2024-07-01' },
        { type: 'Muerte', petName: 'Mora', date: '2024-08-01', description: 'Registro explícito' },
        { type: 'Retorno', petName: 'Mora', date: '2024-09-01' },
        { petName: 'Mora' },
      ]),
    })
    expect(getTimeline(storage, 'unknown')).toEqual({ status: 'not-found', pet: null, events: [] })
    const timeline = getTimeline(storage, 'mora')
    expect(timeline.status).toBe('available')
    expect(timeline.events.map((event) => event.date)).toEqual([
      '2024-02-01', '2024-03-01', '2024-04-01', '2024-05-01', '2024-06-01', '2024-07-01', '2024-08-01', '2024-09-01', '', '',
    ])
    expect(timeline.events[1]).toMatchObject({ type: 'Adopción', description: 'Adopción registrada en el historial.' })
    expect(timeline.events[2]).toMatchObject({ type: 'Retorno', description: 'Retorno registrado' })
    expect(timeline.events[3]).toMatchObject({ type: 'Vacunación', description: 'Vacuna del historial compartido' })
    expect(timeline.events[4]).toMatchObject({ type: 'Adopción', date: '2024-06-01', description: 'Desconocido registrada en el historial.' })
    expect(timeline.events[5]).toMatchObject({ type: 'Adopción', date: '2024-07-01' })
    expect(timeline.events[6]).toMatchObject({ type: 'Muerte', description: 'Registro explícito' })
    expect(timeline.events[7]).toMatchObject({ type: 'Retorno', description: 'Retorno registrada en el historial.' })
    expect(timeline.events[8]).toMatchObject({ type: 'Enfermedad', date: '', description: 'Fecha pendiente' })
    expect(timeline.events[9]).toMatchObject({ type: 'Adopción', date: '', description: 'undefined registrada en el historial.' })
  })

  it('filters by type and inclusive date range', () => {
    const events = [
      { type: 'Nacimiento', date: '2020-01-01' },
      { type: 'Vacunación', date: '2024-02-01' },
      { type: 'Adopción', date: '2025-01-01' },
    ]
    expect(filterTimeline(events, { type: 'Vacunación', from: '2024-01-01', to: '2024-12-31' })).toEqual([events[1]])
    expect(filterTimeline(events, { from: '2024-01-01' })).toEqual(events.slice(1))
    expect(filterTimeline(events, { to: '2024-12-31' })).toEqual(events.slice(0, 2))
    expect(filterTimeline(events, { from: '2024-02-01', to: '2025-01-01' })).toEqual(events.slice(1, 2))
    expect(filterTimeline(events, { type: 'Todos' })).toEqual(events)
    expect(TIMELINE_TYPES).toContain('Muerte')
  })

  it('validates chronological date filters', () => {
    expect(validateTimelineFilters({ from: '2025-01-01', to: '2024-01-01' })).toBe('La fecha inicial no puede ser posterior a la fecha final.')
    expect(validateTimelineFilters({ from: '2024-01-01', to: '2025-01-01' })).toBe('')
    expect(validateTimelineFilters({ from: '', to: '2025-01-01' })).toBe('')
  })
})
