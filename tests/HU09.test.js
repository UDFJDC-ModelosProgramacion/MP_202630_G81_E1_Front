import { describe, expect, it, vi } from 'vitest'
import {
  ADOPTANTE_STORAGE_KEY,
  getStoredAdoptanteId,
  buildAdoptantePayload,
  registerAdoptante,
  storeAdoptanteId,
  validateAdoptante,
} from '../src/workflows/HU09.js'

const validValues = {
  nombre: ' Camila Rodríguez ',
  email: 'camila@example.com',
  telefono: '+57 300 123 4567',
  ciudad: 'Bogotá',
  direccion: 'Cra. 10 #20-30',
}

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body }
}

describe('validateAdoptante', () => {
  it('accepts a complete registration', () => {
    expect(validateAdoptante(validValues)).toEqual({})
  })

  it.each([
    ['nombre', ''],
    ['nombre', 'A'],
    ['email', 'not-an-email'],
    ['telefono', '123'],
    ['telefono', '1234567890123456'],
    ['ciudad', '   '],
    ['direccion', ''],
  ])('rejects an invalid %s (%j)', (field, value) => {
    expect(validateAdoptante({ ...validValues, [field]: value })).toHaveProperty(field)
  })

  it('reports every missing field when values are not strings', () => {
    expect(Object.keys(validateAdoptante({}))).toEqual([
      'nombre', 'email', 'telefono', 'ciudad', 'direccion',
    ])
  })
})

describe('buildAdoptantePayload', () => {
  it('trims every field and keeps only the API fields', () => {
    expect(buildAdoptantePayload({
      nombre: ' Camila ', email: ' c@x.co ', telefono: ' 3001234567 ',
      ciudad: ' Bogotá ', direccion: ' Cra 1 ', extra: 'ignored',
    })).toEqual({
      nombre: 'Camila', email: 'c@x.co', telefono: '3001234567',
      ciudad: 'Bogotá', direccion: 'Cra 1',
    })
  })
})

describe('registerAdoptante', () => {
  const payload = buildAdoptantePayload(validValues)

  it('posts the adoptante and returns the created resource', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 7, ...payload }))

    const result = await registerAdoptante(payload, { fetchFn, apiUrl: 'http://api.test' })

    expect(result).toEqual({ ok: true, adoptante: { id: 7, ...payload } })
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/adoptantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('returns the message sent by the API when it rejects the registration', async () => {
    const body = { apierror: { message: 'Ya existe un adoptante registrado con ese correo electrónico' } }
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(body, false))

    expect(await registerAdoptante(payload, { fetchFn })).toEqual({
      ok: false,
      message: 'Ya existe un adoptante registrado con ese correo electrónico',
    })
  })
})

describe('storeAdoptanteId', () => {
  function memoryStorage() {
    const data = new Map()
    return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
  }

  it('saves the id as text so the profile can read it later', () => {
    const storage = memoryStorage()
    storeAdoptanteId(12, storage)
    expect(storage.getItem(ADOPTANTE_STORAGE_KEY)).toBe('12')
  })

  it.each([undefined, null])('ignores a missing id (%s)', (id) => {
    const storage = memoryStorage()
    storeAdoptanteId(id, storage)
    expect(storage.getItem(ADOPTANTE_STORAGE_KEY)).toBeNull()
  })

  it('reads the saved id back', () => {
    const storage = memoryStorage()
    expect(getStoredAdoptanteId(storage)).toBeNull()
    storeAdoptanteId(3, storage)
    expect(getStoredAdoptanteId(storage)).toBe('3')
  })
})
