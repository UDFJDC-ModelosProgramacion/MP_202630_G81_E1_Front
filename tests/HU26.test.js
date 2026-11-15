import { describe, expect, it, vi } from 'vitest'
import {
  buildNotificationPayload,
  createNotification,
  DEFAULT_API_URL,
  fetchAdopters,
  fetchPets,
  getApiUrl,
  isValidDate,
  normalizeAdopter,
  normalizePet,
  NotificationError,
  validateNotification,
} from '../src/workflows/HU26.js'

function jsonResponse(data, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(data),
  }
}

const validValues = {
  tipo: ' Recordatorio de cita ',
  mensaje: ' La cita de Mora es mañana. ',
  fecha: '2026-11-10',
  canal: 'EMAIL',
  mascotaId: '2',
  adoptanteId: '7',
}

describe('getApiUrl', () => {
  it('uses the local backend URL by default', () => {
    expect(getApiUrl({})).toBe(DEFAULT_API_URL)
  })

  it('uses VITE_API_URL and removes trailing slashes', () => {
    expect(getApiUrl({ VITE_API_URL: 'http://localhost:8999/api///' }))
      .toBe('http://localhost:8999/api')
  })
})

describe('normalizers', () => {
  it('normalizes a pet', () => {
    expect(normalizePet({ id: 2, nombre: ' Mora ', especie: 'Perro' })).toEqual({
      id: 2,
      name: 'Mora',
      species: 'Perro',
      label: 'Mora · Perro (ID 2)',
    })
  })

  it('normalizes an adopter', () => {
    expect(normalizeAdopter({ id: 7, nombre: 'Ana', apellidos: 'Pérez' })).toEqual({
      id: 7,
      name: 'Ana Pérez',
      label: 'Ana Pérez (ID 7)',
    })
  })

  it('uses safe names when related data is missing', () => {
    expect(normalizePet({ id: 3 }).label).toBe('Mascota sin nombre (ID 3)')
    expect(normalizeAdopter({ id: 4 }).label).toBe('Adoptante sin nombre (ID 4)')
  })
})

describe('date and form validation', () => {
  it('accepts only real calendar dates', () => {
    expect(isValidDate('2026-11-10')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('invalid')).toBe(false)
  })

  it('accepts a complete notification', () => {
    expect(validateNotification(validValues)).toEqual({})
  })

  it('requires type, message, date, channel and existing pet id format', () => {
    expect(validateNotification({
      tipo: ' ',
      mensaje: '',
      fecha: '2026-02-30',
      canal: '',
      mascotaId: '',
      adoptanteId: '',
    })).toEqual({
      tipo: 'Escribe el tipo de notificación.',
      mensaje: 'Escribe el mensaje de la notificación.',
      fecha: 'Selecciona una fecha válida.',
      canal: 'Selecciona un canal válido.',
      mascotaId: 'Selecciona una mascota existente.',
    })
  })

  it.each(['EMAIL', 'SMS', 'PUSH'])('accepts channel %s', (canal) => {
    expect(validateNotification({ ...validValues, canal })).toEqual({})
  })

  it('rejects an invalid channel', () => {
    expect(validateNotification({ ...validValues, canal: 'WHATSAPP' }).canal)
      .toBe('Selecciona un canal válido.')
  })

  it('allows an omitted adopter', () => {
    expect(validateNotification({ ...validValues, adoptanteId: '' })).toEqual({})
  })

  it('rejects an invalid adopter id format', () => {
    expect(validateNotification({ ...validValues, adoptanteId: 'abc' }).adoptanteId)
      .toBe('Selecciona un adoptante válido.')
  })
})

describe('buildNotificationPayload', () => {
  it('builds the DTO expected by the backend', () => {
    expect(buildNotificationPayload(validValues)).toEqual({
      tipo: 'Recordatorio de cita',
      mensaje: 'La cita de Mora es mañana.',
      fecha: '2026-11-10T00:00:00.000Z',
      canal: 'EMAIL',
      mascota: { id: 2 },
      adoptante: { id: 7 },
    })
  })

  it('sends null when no adopter is selected', () => {
    expect(buildNotificationPayload({ ...validValues, adoptanteId: '' }).adoptante).toBeNull()
  })

  it('does not build a payload with invalid values', () => {
    expect(() => buildNotificationPayload({ ...validValues, canal: '' }))
      .toThrow(NotificationError)
  })
})

describe('fetchPets', () => {
  it('requests the pets endpoint and normalizes the response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([
      { id: 2, nombre: 'Mora', especie: 'Perro' },
    ]))
    const result = await fetchPets(fetchFn, 'http://api.test/api')
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/mascotas', {
      headers: { Accept: 'application/json' },
    })
    expect(result[0].label).toBe('Mora · Perro (ID 2)')
  })

  it('rejects an unexpected response format', async () => {
    await expect(fetchPets(vi.fn().mockResolvedValue(jsonResponse({})), 'http://api.test/api'))
      .rejects.toThrow('formato inesperado')
  })
})

describe('fetchAdopters', () => {
  it('requests the adopters endpoint and normalizes the response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([
      { id: 7, nombre: 'Ana', apellidos: 'Pérez' },
    ]))
    const result = await fetchAdopters(fetchFn, 'http://api.test/api')
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/adoptantes', {
      headers: { Accept: 'application/json' },
    })
    expect(result[0].label).toBe('Ana Pérez (ID 7)')
  })

  it('rejects an unexpected response format', async () => {
    await expect(fetchAdopters(vi.fn().mockResolvedValue(jsonResponse(null)), 'http://api.test/api'))
      .rejects.toThrow('formato inesperado')
  })
})

describe('createNotification', () => {
  it('sends a POST request with the expected JSON body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 11, tipo: 'Recordatorio' }, { status: 201 }))
    const result = await createNotification(fetchFn, validValues, 'http://api.test/api')
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/notificaciones', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildNotificationPayload(validValues)),
    })
    expect(result.id).toBe(11)
  })

  it('sends a null adopter when it is optional', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 12 }))
    await createNotification(fetchFn, { ...validValues, adoptanteId: '' }, 'http://api.test/api')
    const body = JSON.parse(fetchFn.mock.calls[0][1].body)
    expect(body.adoptante).toBeNull()
  })

  it('shows the backend validation error when the request fails', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(
      { message: 'El canal de la notificación no puede ser vacío' },
      { ok: false, status: 400 },
    ))
    await expect(createNotification(fetchFn, validValues, 'http://api.test/api'))
      .rejects.toThrow('El canal de la notificación no puede ser vacío')
  })

  it('reports network errors', async () => {
    await expect(createNotification(vi.fn().mockRejectedValue(new Error('offline')), validValues))
      .rejects.toThrow('No pudimos conectar con el servidor')
  })

  it('rejects invalid values before calling the API', async () => {
    const fetchFn = vi.fn()
    await expect(createNotification(fetchFn, { ...validValues, mascotaId: '' }))
      .rejects.toThrow(NotificationError)
    expect(fetchFn).not.toHaveBeenCalled()
  })
})
describe('additional coverage HU26', () => {
  it('normalizes pets without ID or species', () => {
    expect(normalizePet({ nombre: 'Mora' })).toEqual({
      id: null,
      name: 'Mora',
      species: '',
      label: 'Mora (ID ?)',
    })
  })

  it('normalizes adopters without ID and with full name', () => {
    expect(normalizeAdopter({
      nombreCompleto: ' Ana Pérez ',
    })).toEqual({
      id: null,
      name: 'Ana Pérez',
      label: 'Ana Pérez (ID ?)',
    })
  })

  it('normalizes adopters with apellido only', () => {
    expect(normalizeAdopter({
      id: 8,
      apellido: 'Gómez',
    }).name).toBe('Gómez')
  })

  it('filters pets without ID', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([
      { nombre: 'Sin ID' },
      { id: 2, nombre: 'Mora' },
    ]))

    const result = await fetchPets(fetchFn)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('filters adopters without ID', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([
      { nombre: 'Sin ID' },
      { id: 7, nombre: 'Ana' },
    ]))

    const result = await fetchAdopters(fetchFn)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(7)
  })

  it('handles a successful response without content', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    expect(await createNotification(fetchFn, validValues)).toBeNull()
  })

  it('handles unreadable successful JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
    })

    await expect(createNotification(fetchFn, validValues))
      .rejects.toThrow('no se puede leer')
  })

  it('handles unreadable error JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
    })

    await expect(createNotification(fetchFn, validValues))
      .rejects.toThrow('No fue posible registrar la notificación.')
  })

  it('uses mensaje when backend returns an error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(
      { mensaje: 'Error de notificación' },
      { ok: false, status: 400 },
    ))

    await expect(createNotification(fetchFn, validValues))
      .rejects.toThrow('Error de notificación')
  })

  it('uses error when backend returns an error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(
      { error: 'Error interno' },
      { ok: false, status: 500 },
    ))

    await expect(createNotification(fetchFn, validValues))
      .rejects.toThrow('Error interno')
  })

  it('uses fallback message when backend returns no error details', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(
      {},
      { ok: false, status: 500 },
    ))

    await expect(createNotification(fetchFn, validValues))
      .rejects.toThrow('No fue posible registrar la notificación.')
  })

  it('rejects invalid dates and IDs', () => {
    expect(isValidDate(null)).toBe(false)
    expect(isValidDate('2026-02-29')).toBe(false)

    expect(validateNotification({
      ...validValues,
      mascotaId: '2.5',
      adoptanteId: '-1',
    })).toMatchObject({
      mascotaId: 'Selecciona una mascota existente.',
      adoptanteId: 'Selecciona un adoptante válido.',
    })
  })

  it('uses default URL for invalid environment configuration', () => {
    expect(getApiUrl({ VITE_API_URL: null })).toBe(DEFAULT_API_URL)
    expect(getApiUrl({ VITE_API_URL: '   ' })).toBe(DEFAULT_API_URL)
  })
  it('uses first name when full name is unavailable', () => {
  expect(normalizeAdopter({
    id: 9,
    nombre: 'Carlos',
    apellido: '',
    apellidos: '',
    nombreCompleto: '',
  })).toEqual({
    id: 9,
    name: 'Carlos',
    label: 'Carlos (ID 9)',
  })
})
it('normalizes a pet with species but without ID', () => {
  expect(normalizePet({
    nombre: 'Mora',
    especie: 'Perro',
  })).toEqual({
    id: null,
    name: 'Mora',
    species: 'Perro',
    label: 'Mora · Perro (ID ?)',
  })
})
})