import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ADOPTANTE_STORAGE_KEY,
  API_BASE_URL,
  CONNECTION_ERROR,
  UNEXPECTED_ERROR,
  buildAdoptantePayload,
  registerAdoptante,
  storeAdoptanteId,
  validateAdoptante,
} from '../src/adoptante.js'

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

afterEach(() => {
  vi.unstubAllGlobals()
})

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

    const result = await registerAdoptante(payload, { fetchFn, baseUrl: 'http://api.test' })

    expect(result).toEqual({ ok: true, adoptante: { id: 7, ...payload } })
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/adoptantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('uses the global fetch and the default API url when no options are given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await registerAdoptante(payload)

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/adoptantes`)
  })

  it('returns the message sent by the API when it rejects the registration', async () => {
    const body = { apierror: { message: 'Ya existe un adoptante registrado con ese correo electrónico' } }
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(body, false))

    expect(await registerAdoptante(payload, { fetchFn })).toEqual({
      ok: false,
      message: 'Ya existe un adoptante registrado con ese correo electrónico',
    })
  })

  it.each([
    ['an error body without message', { apierror: {} }],
    ['an unexpected error body', {}],
  ])('falls back to a generic message for %s', async (_name, body) => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(body, false))

    expect(await registerAdoptante(payload, { fetchFn })).toEqual({ ok: false, message: UNEXPECTED_ERROR })
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => { throw new SyntaxError('Unexpected token') },
    })

    expect(await registerAdoptante(payload, { fetchFn })).toEqual({ ok: false, message: UNEXPECTED_ERROR })
  })

  it('reports a connection error when the request fails', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    expect(await registerAdoptante(payload, { fetchFn })).toEqual({ ok: false, message: CONNECTION_ERROR })
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
})
