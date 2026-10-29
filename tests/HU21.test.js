import { describe, expect, it } from 'vitest'
import {
  PET_AVAILABILITY_STORAGE_KEY,
  PET_HISTORY_STORAGE_KEY,
  readCollection,
} from '../src/workflows/storage.js'
import {
  createReturn,
  RETURNS_STORAGE_KEY,
  saveReturn,
  validateReturn,
} from '../src/workflows/HU21.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

const returnValues = {
  petName: 'Mora',
  adopterName: 'Camila Rodríguez',
  returnDate: '2026-10-25',
  reason: 'Incompatibilidad con el adoptante',
  description: 'La convivencia no resultó adecuada para la familia.',
  compatibleReAdoption: 'si',
}

describe('HU21 pet return', () => {
  it('accepts a complete return and records availability for readoption', () => {
    expect(validateReturn(returnValues)).toEqual({})
    expect(createReturn(returnValues, { id: 'HU21-001' })).toMatchObject({
      id: 'HU21-001',
      compatibleReAdoption: true,
      availability: 'Disponible',
      status: 'Registrada',
    })
  })

  it('validates return details, calendar date and readoption decision', () => {
    expect(validateReturn({
      petName: '',
      adopterName: null,
      returnDate: '2026-02-30',
      reason: 'No aplica',
      description: ' ',
      compatibleReAdoption: '',
    })).toEqual({
      petName: 'Ingresa el nombre de la mascota.',
      adopterName: 'Ingresa el nombre del adoptante.',
      returnDate: 'Selecciona una fecha de devolución válida.',
      reason: 'Selecciona el motivo de la devolución.',
      description: 'Describe la situación de la devolución.',
      compatibleReAdoption: 'Indica si la mascota puede volver a estar disponible.',
    })
  })

  it('marks a pet for evaluation when it is not ready for readoption', () => {
    expect(createReturn({ ...returnValues, compatibleReAdoption: 'no' }, {
      id: 'HU21-002',
    })).toMatchObject({
      compatibleReAdoption: false,
      availability: 'En evaluación',
    })
  })

  it('preserves return history and updates an existing availability record', () => {
    const existing = createReturn(returnValues, { id: 'HU21-OLD' })
    const next = createReturn({ ...returnValues, compatibleReAdoption: 'no' }, {
      id: 'HU21-002',
    })
    const storage = memoryStorage({
      [RETURNS_STORAGE_KEY]: JSON.stringify([existing]),
      [PET_HISTORY_STORAGE_KEY]: JSON.stringify([
        { type: 'Adopción', petName: 'Mora', adoptionId: 'HU19-001' },
      ]),
      [PET_AVAILABILITY_STORAGE_KEY]: JSON.stringify([
        { petName: 'Mora', status: 'Adoptada' },
      ]),
    })

    saveReturn(storage, next)

    expect(readCollection(storage, RETURNS_STORAGE_KEY)).toEqual([existing, next])
    expect(readCollection(storage, PET_HISTORY_STORAGE_KEY)).toHaveLength(2)
    expect(readCollection(storage, PET_HISTORY_STORAGE_KEY)[0].type).toBe('Adopción')
    expect(readCollection(storage, PET_AVAILABILITY_STORAGE_KEY)).toEqual([
      { petName: 'Mora', status: 'En evaluación' },
    ])
  })

  it('creates availability and history entries for a first return', () => {
    const returnRecord = createReturn(returnValues, { id: 'HU21-003' })
    const storage = memoryStorage()

    saveReturn(storage, returnRecord)

    expect(readCollection(storage, RETURNS_STORAGE_KEY)).toEqual([returnRecord])
    expect(readCollection(storage, PET_HISTORY_STORAGE_KEY)).toEqual([
      {
        type: 'Retorno',
        returnId: 'HU21-003',
        petName: 'Mora',
        date: '2026-10-25',
        reason: 'Incompatibilidad con el adoptante',
        description: 'La convivencia no resultó adecuada para la familia.',
      },
    ])
    expect(readCollection(storage, PET_AVAILABILITY_STORAGE_KEY)).toEqual([
      { petName: 'Mora', status: 'Disponible' },
    ])
  })

  it('generates an identifier and timestamp when omitted', () => {
    const returnRecord = createReturn(returnValues)

    expect(returnRecord.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(Number.isNaN(Date.parse(returnRecord.createdAt))).toBe(false)
  })
})
