import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_API_URL } from '../src/catalog/catalog.js'
import {
  SHELTER_FIELDS,
  SHELTER_NOT_FOUND,
  ShelterError,
  createShelter,
  fetchShelter,
  normalizeShelter,
  parseShelterRoute,
  successMessage,
  trimValues,
  updateShelter,
  validateShelter,
} from '../src/workflows/HU30.js'

const API = 'http://api.test/api'
const values = {
  nombre: 'Huellitas',
  ciudad: 'Bogotá',
  direccion: 'Calle 1 # 2-3',
  telefono: '3001234567',
  correo: 'contacto@huellitas.co',
  descripcion: 'Refugio de perros y gatos',
}

function response(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body }
}

function brokenJson({ ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => { throw new SyntaxError('bad json') } }
}

describe('HU30 trimValues', () => {
  it('trims every field and fills missing ones with empty text', () => {
    const clean = trimValues({ nombre: '  Huellitas  ', ciudad: undefined })
    expect(clean.nombre).toBe('Huellitas')
    expect(clean.ciudad).toBe('')
    expect(Object.keys(clean)).toEqual(SHELTER_FIELDS.map((f) => f.name))
  })
})

describe('HU30 validateShelter', () => {
  it('accepts a complete shelter', () => {
    expect(validateShelter(values)).toEqual({})
  })

  it('requires every field, including blank text', () => {
    const errors = validateShelter({ nombre: '   ' })
    expect(Object.keys(errors)).toEqual(SHELTER_FIELDS.map((f) => f.name))
    expect(errors.nombre).toBe('El nombre es obligatorio.')
    expect(errors.correo).toBe('El correo es obligatorio.')
  })

  it('rejects an email with a wrong format', () => {
    expect(validateShelter({ ...values, correo: 'sin-arroba' }).correo).toContain('correo válido')
    expect(validateShelter({ ...values, correo: 'a@b' }).correo).toContain('correo válido')
  })
})

describe('HU30 parseShelterRoute', () => {
  it('detects creation when there is no id', () => {
    expect(parseShelterRoute()).toEqual({ editing: false, id: null })
    expect(parseShelterRoute('?otro=1')).toEqual({ editing: false, id: null })
  })

  it('detects edition with a numeric id', () => {
    expect(parseShelterRoute('?id=5')).toEqual({ editing: true, id: '5' })
  })

  it('detects edition with an invalid id', () => {
    expect(parseShelterRoute('?id=abc')).toEqual({ editing: true, id: null })
    expect(parseShelterRoute('?id=')).toEqual({ editing: true, id: null })
  })
})

describe('HU30 normalizeShelter', () => {
  it('maps the fields sent by the API', () => {
    expect(normalizeShelter({ id: 4, ...values })).toEqual({ id: 4, ...values })
  })

  it('uses safe defaults for missing data', () => {
    expect(normalizeShelter(null)).toEqual({ id: null, nombre: '', ciudad: '', direccion: '', telefono: '', correo: '', descripcion: '' })
    expect(normalizeShelter({ nombre: 'Solo nombre' }).id).toBeNull()
  })
})

describe('HU30 successMessage', () => {
  it('differs between creating and editing', () => {
    expect(successMessage(false)).toBe('Refugio registrado correctamente.')
    expect(successMessage(true)).toBe('Refugio actualizado correctamente.')
  })
})

describe('HU30 fetchShelter', () => {
  it('requests one shelter by id', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ id: 5, ...values }))
    const shelter = await fetchShelter(fetchFn, '5', API)
    expect(fetchFn).toHaveBeenCalledWith(`${API}/refugios/5`, { headers: { Accept: 'application/json' } })
    expect(shelter).toEqual({ id: 5, ...values })
  })

  it('uses the default API URL when none is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ id: 5, ...values }))
    await fetchShelter(fetchFn, 5)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/refugios/5`)
  })

  it('reports that the shelter was not found', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({}, { ok: false, status: 404 }))
    const error = await fetchShelter(fetchFn, '999', API).catch((e) => e)
    expect(error).toBeInstanceOf(ShelterError)
    expect(error.message).toBe(SHELTER_NOT_FOUND)
    expect(error.status).toBe(404)
  })

  it('reports responses that are not a single shelter', async () => {
    for (const reply of [response(null), response('texto'), response([]), brokenJson()]) {
      const fetchFn = vi.fn().mockResolvedValue(reply)
      await expect(fetchShelter(fetchFn, '1', API)).rejects.toThrow('formato inesperado')
    }
  })
})

describe('HU30 createShelter', () => {
  it('sends the trimmed data with POST and returns the saved shelter', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ id: 9, ...values }, { status: 201 }))

    const saved = await createShelter(fetchFn, { ...values, nombre: '  Huellitas ' }, API)

    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe(`${API}/refugios`)
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual(values)
    expect(saved.id).toBe(9)
  })

  it('uses the default API URL when none is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(values))
    await createShelter(fetchFn, values)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/refugios`)
  })

  it('accepts a successful reply without a body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 204 }))
    expect((await createShelter(fetchFn, values, API)).id).toBeNull()
  })

  it('reports network failures', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(createShelter(fetchFn, values, API)).rejects.toThrow('No pudimos conectar con el servidor')
  })

  it('shows the message sent by the server when it rejects the data', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ apierror: { message: ' Ya existe un refugio con ese nombre ' } }, { ok: false, status: 400 }))
    const error = await createShelter(fetchFn, values, API).catch((e) => e)
    expect(error.message).toBe('Ya existe un refugio con ese nombre')
    expect(error.status).toBe(400)
  })

  it('uses a generic message when the server does not explain the error', async () => {
    for (const reply of [
      response({ apierror: { message: 42 } }, { ok: false, status: 500 }),
      response({ message: 'otro formato' }, { ok: false, status: 500 }),
      response(null, { ok: false, status: 500 }),
      brokenJson({ ok: false, status: 500 }),
    ]) {
      const fetchFn = vi.fn().mockResolvedValue(reply)
      await expect(createShelter(fetchFn, values, API)).rejects.toThrow('no pudo procesar el refugio')
    }
  })

  it('treats a 404 while creating as a generic server error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({}, { ok: false, status: 404 }))
    const error = await createShelter(fetchFn, values, API).catch((e) => e)
    expect(error.status).toBe(404)
    expect(error.message).toContain('no pudo procesar el refugio')
  })
})

describe('HU30 updateShelter', () => {
  it('sends the data with PUT to the shelter URL', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ id: 5, ...values }))

    const saved = await updateShelter(fetchFn, '5', values, API)

    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe(`${API}/refugios/5`)
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual(values)
    expect(saved.id).toBe(5)
  })

  it('uses the default API URL when none is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(values))
    await updateShelter(fetchFn, 5, values)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/refugios/5`)
  })

  it('reports that the shelter does not exist when the id is not found', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({}, { ok: false, status: 404 }))
    const error = await updateShelter(fetchFn, '999', values, API).catch((e) => e)
    expect(error.message).toBe(SHELTER_NOT_FOUND)
    expect(error.status).toBe(404)
  })
})
