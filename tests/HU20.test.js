import { describe, expect, it } from 'vitest'
import {
  addDays,
  appendCollection,
  isValidDate,
  readCollection,
} from '../src/workflows/storage.js'
import {
  createTrial,
  saveTrial,
  TRIALS_STORAGE_KEY,
  validateTrial,
} from '../src/workflows/HU20.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

const trialValues = {
  adopterName: 'Camila Rodríguez',
  petName: 'Mora',
  startDate: '2026-10-25',
  durationDays: '7',
  observation: 'Primera semana de adaptación',
}

describe('shared collection and date helpers', () => {
  it('reads empty and populated collections', () => {
    const storage = memoryStorage({ saved: JSON.stringify([{ id: 'existing' }]) })

    expect(readCollection(storage, 'missing')).toEqual([])
    expect(readCollection(storage, 'saved')).toEqual([{ id: 'existing' }])
  })

  it('reports malformed and non-list saved data', () => {
    expect(() => readCollection(memoryStorage({ saved: '{invalid' }), 'saved'))
      .toThrow(SyntaxError)
    expect(() => readCollection(memoryStorage({ saved: '{"id":"one"}' }), 'saved'))
      .toThrow('El registro saved debe ser una lista.')
  })

  it('appends a record without removing existing collection entries', () => {
    const storage = memoryStorage({ saved: JSON.stringify([{ id: 'old' }]) })

    appendCollection(storage, 'saved', { id: 'new' })

    expect(readCollection(storage, 'saved')).toEqual([{ id: 'old' }, { id: 'new' }])
  })

  it('validates calendar dates and adds days using UTC calendar arithmetic', () => {
    expect(isValidDate('2026-10-25')).toBe(true)
    expect(isValidDate(20261025)).toBe(false)
    expect(isValidDate('25-10-2026')).toBe(false)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(addDays('2028-02-27', 2)).toBe('2028-02-29')
  })
})

describe('HU20 cohabitation trial', () => {
  it('accepts a trial with a positive whole-day duration', () => {
    expect(validateTrial(trialValues)).toEqual({})
  })

  it('validates participants, start date and positive integer duration', () => {
    expect(validateTrial({
      adopterName: '',
      petName: null,
      startDate: '2026-02-30',
      durationDays: '1.5',
    })).toEqual({
      adopterName: 'Ingresa el nombre del adoptante.',
      petName: 'Ingresa el nombre de la mascota.',
      startDate: 'Selecciona una fecha de inicio válida.',
      durationDays: 'La duración debe ser un número entero mayor que cero.',
    })
    expect(validateTrial({ ...trialValues, durationDays: '0' }))
      .toHaveProperty('durationDays')
  })

  it('creates a scheduled trial with a calculated end date and stores it', () => {
    const trial = createTrial(trialValues, {
      id: 'HU20-001',
      createdAt: '2026-10-25T10:00:00.000Z',
    })
    const storage = memoryStorage()

    expect(trial).toEqual({
      id: 'HU20-001',
      createdAt: '2026-10-25T10:00:00.000Z',
      adopterName: 'Camila Rodríguez',
      petName: 'Mora',
      startDate: '2026-10-25',
      endDate: '2026-11-01',
      durationDays: 7,
      observation: 'Primera semana de adaptación',
      status: 'Programada',
    })

    saveTrial(storage, trial)

    expect(readCollection(storage, TRIALS_STORAGE_KEY)).toEqual([trial])
  })

  it('generates an identifier and timestamp when omitted', () => {
    const trial = createTrial(trialValues)

    expect(trial.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(Number.isNaN(Date.parse(trial.createdAt))).toBe(false)
  })
})
