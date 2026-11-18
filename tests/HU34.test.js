import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_API_URL } from '../src/catalog/catalog.js'
import {
  NO_VETS_MESSAGE,
  VET_FIELDS,
  VET_ID_ERROR,
  VET_NOT_FOUND,
  VET_REFUGIO_NOT_FOUND,
  buildVetPayload,
  fetchVet,
  fetchVets,
  normalizeVet,
  registerVet,
  renderVetCard,
  renderVetList,
  validateVet,
} from '../src/workflows/HU34.js'

const API = 'http://api.test/api'
const res = (body, { ok = true, status = 200 } = {}) => ({ ok, status, json: async () => body })
const brokenJson = ({ ok = true, status = 200 } = {}) => ({ ok, status, json: async () => { throw new SyntaxError('bad') } })
const values = {
  nombre: 'Dra. Ana Ruiz', telefono: '3001112233', correo: 'ana@vet.co', especialidad: 'Medicina general',
  disponibilidad: 'Lunes a viernes', refugioId: '7',
}
const raw = { id: 4, nombre: 'Dra. Ana Ruiz', telefono: '3001112233', correo: 'ana@vet.co', especialidad: 'Medicina general', disponibilidad: 'Lunes a viernes', refugio: { id: 7, nombre: 'Huellitas' } }

describe('validateVet', () => {
  it('accepts a complete veterinarian', () => {
    expect(validateVet(values)).toEqual({})
  })

  it('requires every field', () => {
    const errors = validateVet({})
    expect(Object.keys(errors)).toEqual(VET_FIELDS.map((f) => f.name))
    expect(errors.refugioId).toBe('El número de refugio es obligatorio.')
  })

  it('validates the email and the shelter number', () => {
    expect(validateVet({ ...values, correo: 'sin-arroba' }).correo).toContain('correo válido')
    expect(validateVet({ ...values, refugioId: 'x' }).refugioId).toContain('número positivo')
  })
})

describe('buildVetPayload', () => {
  it('associates the veterinarian with a shelter', () => {
    expect(buildVetPayload({ ...values, nombre: ' Dra. Ana Ruiz ' })).toEqual({
      nombre: 'Dra. Ana Ruiz', telefono: '3001112233', email: 'ana@vet.co', especialidad: 'Medicina general',
      disponibilidad: 'Lunes a viernes', refugio: { id: 7 },
    })
  })
})

describe('normalizeVet', () => {
  it('maps the data of the API', () => {
    expect(normalizeVet(raw)).toEqual({
      id: 4, nombre: 'Dra. Ana Ruiz', telefono: '3001112233', correo: 'ana@vet.co',
      especialidad: 'Medicina general', disponibilidad: 'Lunes a viernes', refugio: 'Huellitas',
    })
  })

  it('reads the email sent by the API as `email`', () => {
    const { correo, ...withoutCorreo } = raw
    expect(normalizeVet({ ...withoutCorreo, email: correo }).correo).toBe('ana@vet.co')
  })

  it('uses safe defaults for missing data', () => {
    expect(normalizeVet({})).toEqual({
      id: null, nombre: 'Sin nombre', telefono: '', correo: '', especialidad: 'Sin especialidad',
      disponibilidad: 'No registrada', refugio: 'Refugio no registrado',
    })
  })
})

describe('registerVet', () => {
  it('registers with POST and returns the veterinarian', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(raw, { status: 201 }))
    const vet = await registerVet(fetchFn, values, API)
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe(`${API}/veterinarios`)
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body).refugio).toEqual({ id: 7 })
    expect(vet.id).toBe(4)
  })

  it('accepts a successful reply without a body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 201 }))
    expect(await registerVet(fetchFn, values)).toBeNull()
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/veterinarios`)
  })

  it('reports that the shelter does not exist', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 404 }))
    await expect(registerVet(fetchFn, values, API)).rejects.toThrow(VET_REFUGIO_NOT_FOUND)
  })
})

describe('fetchVets', () => {
  it('lists the registered veterinarians', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res([raw]))
    const vets = await fetchVets(fetchFn, API)
    expect(vets).toHaveLength(1)
    expect(fetchFn.mock.calls[0][0]).toBe(`${API}/veterinarios`)
  })

  it('uses the default API URL and rejects unexpected formats', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}))
    await expect(fetchVets(fetchFn)).rejects.toThrow('formato inesperado')
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/veterinarios`)
  })

  it('reports server failures', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 500 }))
    await expect(fetchVets(fetchFn, API)).rejects.toThrow('no pudo entregar los veterinarios')
  })
})

describe('fetchVet', () => {
  it('asks for a valid number', async () => {
    const fetchFn = vi.fn()
    await expect(fetchVet(fetchFn, 'abc', API)).rejects.toThrow(VET_ID_ERROR)
    expect(fetchFn.mock.calls).toHaveLength(0)
  })

  it('returns one veterinarian', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(raw))
    expect((await fetchVet(fetchFn, ' 4 ', API)).nombre).toBe('Dra. Ana Ruiz')
    expect(fetchFn.mock.calls[0][0]).toBe(`${API}/veterinarios/4`)
  })

  it('uses the default API URL', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(raw))
    await fetchVet(fetchFn, 4)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/veterinarios/4`)
  })

  it('reports that the veterinarian was not found', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 404 }))
    const error = await fetchVet(fetchFn, '99', API).catch((e) => e)
    expect(error.message).toBe(VET_NOT_FOUND)
    expect(error.status).toBe(404)
  })

  it('rejects unexpected formats and server failures', async () => {
    await expect(fetchVet(vi.fn().mockResolvedValue(res([])), '4', API)).rejects.toThrow('formato inesperado')
    await expect(fetchVet(vi.fn().mockResolvedValue(res({}, { ok: false, status: 500 })), '4', API)).rejects.toThrow('no pudo entregar el veterinario')
  })
})

describe('rendering', () => {
  it('tells when there are no veterinarians', () => {
    expect(renderVetList([])).toContain(NO_VETS_MESSAGE)
  })

  it('lists the veterinarians and escapes text', () => {
    const html = renderVetList([normalizeVet(raw), normalizeVet({ nombre: '<b>x</b>' })])
    expect(html).toContain('Medicina general')
    expect(html).toContain('Huellitas')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).toContain('data-testid="vet-item"')
  })

  it('renders the card of one veterinarian', () => {
    expect(renderVetCard(normalizeVet(raw))).toContain('ana@vet.co')
    const empty = renderVetCard(normalizeVet({}))
    expect(empty).toContain('No registrado')
    expect(empty).toContain('data-testid="vet-detail"')
  })
})
