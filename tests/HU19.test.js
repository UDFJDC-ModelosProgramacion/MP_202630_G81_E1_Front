import { describe, expect, it } from 'vitest'
import {
  PET_AVAILABILITY_STORAGE_KEY,
  PET_HISTORY_STORAGE_KEY,
  readCollection,
} from '../src/workflows/storage.js'
import {
  createFormalization,
  FORMALIZATIONS_STORAGE_KEY,
  saveFormalization,
  validateFormalization,
} from '../src/workflows/HU19.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

const formalizationValues = {
  adopterName: ' Camila Rodríguez ',
  petName: ' Mora ',
  adoptionDate: '2026-10-25',
  veterinarian: 'Dra. Valentina Ríos',
  nextAppointment: '2026-11-25',
  observation: ' Control inicial ',
}

describe('HU19 adoption formalization', () => {
  it('accepts a complete formalization with follow-up after adoption', () => {
    expect(validateFormalization(formalizationValues)).toEqual({})
  })

  it('validates required fields and follow-up chronology', () => {
    expect(validateFormalization({
      adopterName: ' ',
      petName: null,
      adoptionDate: '2026-10-25',
      veterinarian: '',
      nextAppointment: '2026-10-24',
    })).toEqual({
      adopterName: 'Ingresa el nombre del adoptante.',
      petName: 'Ingresa el nombre de la mascota.',
      veterinarian: 'Asigna un veterinario responsable.',
      nextAppointment: 'La cita de seguimiento no puede ser anterior a la adopción.',
    })
  })

  it('requires valid calendar dates', () => {
    expect(validateFormalization({
      ...formalizationValues,
      adoptionDate: '2026-02-30',
      nextAppointment: 'invalid',
    })).toMatchObject({
      adoptionDate: 'Selecciona una fecha de adopción válida.',
      nextAppointment: 'Selecciona una fecha válida para el seguimiento.',
    })
  })

  it('creates and stores a formal adoption with its assigned veterinarian and history', () => {
    const adoption = createFormalization(formalizationValues, {
      id: 'HU19-001',
      createdAt: '2026-10-25T10:00:00.000Z',
    })
    const storage = memoryStorage()

    expect(adoption).toEqual({
      id: 'HU19-001',
      createdAt: '2026-10-25T10:00:00.000Z',
      adopterName: 'Camila Rodríguez',
      petName: 'Mora',
      adoptionDate: '2026-10-25',
      veterinarian: 'Dra. Valentina Ríos',
      nextAppointment: '2026-11-25',
      observation: 'Control inicial',
      status: 'Formalizada',
      followUpStatus: 'Programado',
    })

    saveFormalization(storage, adoption)

    expect(readCollection(storage, FORMALIZATIONS_STORAGE_KEY)).toEqual([adoption])
    expect(readCollection(storage, PET_HISTORY_STORAGE_KEY)).toMatchObject([
      { type: 'Adopción', adoptionId: 'HU19-001', petName: 'Mora' },
    ])
    expect(readCollection(storage, PET_AVAILABILITY_STORAGE_KEY)).toEqual([
      { petName: 'Mora', status: 'Adoptada' },
    ])
  })

  it('preserves earlier history and updates an existing availability record', () => {
    const adoption = createFormalization(formalizationValues, { id: 'HU19-002' })
    const storage = memoryStorage({
      [PET_HISTORY_STORAGE_KEY]: JSON.stringify([
        { type: 'Retorno', petName: 'Mora', returnId: 'HU21-001' },
      ]),
      [PET_AVAILABILITY_STORAGE_KEY]: JSON.stringify([
        { petName: 'Mora', status: 'Disponible' },
      ]),
    })

    saveFormalization(storage, adoption)

    expect(readCollection(storage, PET_HISTORY_STORAGE_KEY)).toHaveLength(2)
    expect(readCollection(storage, PET_HISTORY_STORAGE_KEY)[0].type).toBe('Retorno')
    expect(readCollection(storage, PET_AVAILABILITY_STORAGE_KEY)).toEqual([
      { petName: 'Mora', status: 'Adoptada' },
    ])
  })

  it('generates an identifier and timestamp when omitted', () => {
    const adoption = createFormalization(formalizationValues)

    expect(adoption.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(Number.isNaN(Date.parse(adoption.createdAt))).toBe(false)
  })
})
