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
