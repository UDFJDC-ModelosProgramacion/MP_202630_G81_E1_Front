import { describe, expect, it } from 'vitest'
import {
  APPLICATION_STORAGE_KEY,
  createApplication,
  getStoredApplications,
  saveApplication,
  validateApplication,
} from '../src/workflows/HU18.js'

const validApplication = {
  fullName: ' Camila Rodríguez ',
  email: 'camila@example.com',
  phone: '+57 300 123 4567',
  city: 'Bogotá',
  address: 'Cra. 10 #20-30',
  housing: 'Apartamento',
  household: 'Con mi pareja',
  experience: 'Sí, tuve mascotas antes',
  reason: 'Queremos darle un hogar lleno de amor.',
  consent: true,
}

function memoryStorage(initialValue = null) {
  const data = new Map()
  if (initialValue !== null) data.set(APPLICATION_STORAGE_KEY, initialValue)
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value),
  }
}

describe('validateApplication', () => {
  it('accepts a complete adoption application', () => {
    expect(validateApplication(validApplication)).toEqual({})
  })

  it.each([
    ['fullName', ''],
    ['email', 'not-an-email'],
    ['phone', '123'],
    ['city', ''],
    ['address', ''],
    ['housing', 'Farm'],
    ['household', 'No one'],
    ['experience', 'Maybe'],
    ['reason', ''],
    ['consent', false],
  ])('rejects an invalid %s', (field, invalidValue) => {
    const application = { ...validApplication, [field]: invalidValue }
    expect(validateApplication(application)).toHaveProperty(field)
  })

  it('rejects phone numbers longer than 15 digits', () => {
    expect(validateApplication({ ...validApplication, phone: '1234567890123456' }))
      .toHaveProperty('phone')
  })

  it('rejects missing or non-text values', () => {
    const application = { ...validApplication, fullName: null, email: undefined }
    expect(validateApplication(application)).toMatchObject({
      fullName: 'required',
      email: 'invalid',
    })
  })
})

describe('adoption application persistence', () => {
  it('creates a pending request linked to Mora and trims personal text', () => {
    const application = createApplication(validApplication, {
      id: 'HU18-001',
      createdAt: '2026-10-25T12:00:00.000Z',
    })

    expect(application).toEqual({
      id: 'HU18-001',
      createdAt: '2026-10-25T12:00:00.000Z',
      petId: 'mora',
      petName: 'Mora',
      status: 'Pendiente',
      fullName: 'Camila Rodríguez',
      email: 'camila@example.com',
      phone: '+57 300 123 4567',
      city: 'Bogotá',
      address: 'Cra. 10 #20-30',
      housing: 'Apartamento',
      household: 'Con mi pareja',
      experience: 'Sí, tuve mascotas antes',
      requestType: 'Adopción',
      reason: 'Queremos darle un hogar lleno de amor.',
    })
  })

  it('generates an identifier and timestamp when they are not provided', () => {
    const application = createApplication(validApplication)

    expect(application.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(Number.isNaN(Date.parse(application.createdAt))).toBe(false)
  })

  it('returns an empty list when no requests have been saved', () => {
    expect(getStoredApplications(memoryStorage())).toEqual([])
  })

  it('loads previously saved requests', () => {
    const saved = [{ id: 'HU18-OLD', status: 'Pendiente' }]
    const storage = memoryStorage(JSON.stringify(saved))

    expect(getStoredApplications(storage)).toEqual(saved)
  })

  it('reports corrupt or unexpected saved request data', () => {
    expect(() => getStoredApplications(memoryStorage('{invalid json')))
      .toThrow(SyntaxError)
    expect(() => getStoredApplications(memoryStorage(JSON.stringify({ id: 'HU18-001' }))))
      .toThrow('Las solicitudes guardadas deben estar en una lista.')
  })

  it('saves a request without removing earlier requests', () => {
    const previous = [{ id: 'HU18-OLD', status: 'Pendiente' }]
    const storage = memoryStorage(JSON.stringify(previous))
    const next = { id: 'HU18-NEW', status: 'Pendiente' }

    saveApplication(next, storage)

    expect(getStoredApplications(storage)).toEqual([...previous, next])
  })
})
