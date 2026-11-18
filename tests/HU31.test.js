import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_API_URL } from '../src/catalog/catalog.js'
import { SHELTER_NOT_FOUND } from '../src/workflows/HU30.js'
import {
  NO_PETS_MESSAGE,
  fetchShelterDetail,
  renderShelterDetail,
  renderShelterPets,
} from '../src/workflows/HU31.js'

const API = 'http://api.test/api'
const res = (body, { ok = true, status = 200 } = {}) => ({ ok, status, json: async () => body })
const shelterRaw = { id: 7, nombre: 'Huellitas', ciudad: 'Bogotá', direccion: 'Calle 1 # 2-3', telefono: '3001234567', correo: 'h@refugio.co', descripcion: 'Refugio de perros' }
const mora = { id: 1, nombre: 'Mora', especie: 'Perro', raza: 'Criollo', edad: 3, estado: 'Disponible', refugio: { id: 7 } }
const felix = { id: 2, nombre: 'Félix', especie: 'Gato', edad: 1, estado: 'En proceso de adopcion', refugio: { id: 9 } }
const orphan = { id: 3, nombre: 'Sin refugio', especie: 'Perro' }

function api(routes) {
  return vi.fn(async (url) => routes[url.replace(API, '')] ?? res({}, { ok: false, status: 404 }))
}

describe('fetchShelterDetail', () => {
  it('uses the pets that come inside the shelter detail', async () => {
    const fetchFn = api({ '/refugios/7': res({ ...shelterRaw, mascotas: [mora] }) })
    const detail = await fetchShelterDetail(fetchFn, '7', API)
    expect(detail.shelter.nombre).toBe('Huellitas')
    expect(detail.pets.map((p) => p.name)).toEqual(['Mora'])
    expect(fetchFn.mock.calls).toHaveLength(1)
  })

  it('filters the pets of the shelter from the pet list when the detail has none', async () => {
    const fetchFn = api({ '/refugios/7': res(shelterRaw), '/mascotas': res([mora, felix, orphan]) })
    const detail = await fetchShelterDetail(fetchFn, '7', API)
    expect(detail.pets.map((p) => p.name)).toEqual(['Mora'])
  })

  it('uses the requested id when the detail does not repeat it', async () => {
    const { id, ...withoutId } = shelterRaw
    const fetchFn = api({ '/refugios/7': res(withoutId), '/mascotas': res([mora]) })
    const detail = await fetchShelterDetail(fetchFn, 7, API)
    expect(id).toBe(7)
    expect(detail.pets).toHaveLength(1)
  })

  it('returns an empty list when the shelter has no pets', async () => {
    const fetchFn = api({ '/refugios/7': res(shelterRaw), '/mascotas': res([felix]) })
    expect((await fetchShelterDetail(fetchFn, '7', API)).pets).toEqual([])
  })

  it('uses the default API URL when none is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({ ...shelterRaw, mascotas: [] }))
    await fetchShelterDetail(fetchFn, 7)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/refugios/7`)
  })

  it('reports that the shelter was not found', async () => {
    const error = await fetchShelterDetail(api({}), '999', API).catch((e) => e)
    expect(error.message).toBe(SHELTER_NOT_FOUND)
    expect(error.status).toBe(404)
  })

  it('reports responses with an unexpected format', async () => {
    await expect(fetchShelterDetail(api({ '/refugios/7': res([]) }), '7', API)).rejects.toThrow('formato inesperado')
    const badList = api({ '/refugios/7': res(shelterRaw), '/mascotas': res({}) })
    await expect(fetchShelterDetail(badList, '7', API)).rejects.toThrow('formato inesperado')
  })

  it('reports server failures', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 500 }))
    await expect(fetchShelterDetail(fetchFn, '7', API)).rejects.toThrow('información del refugio')
  })
})

describe('rendering', () => {
  it('renders the contact data of the shelter', () => {
    const html = renderShelterDetail({ ...shelterRaw, id: 7 })
    for (const value of ['Huellitas', 'Bogotá', 'Calle 1 # 2-3', '3001234567', 'h@refugio.co', 'Refugio de perros']) {
      expect(html).toContain(value)
    }
    expect(html).toContain('data-testid="shelter-detail"')
  })

  it('shows placeholders for missing data and escapes text', () => {
    const html = renderShelterDetail({ nombre: '', ciudad: '<b>x</b>', direccion: '', telefono: '', correo: '', descripcion: '' })
    expect(html).toContain('Refugio sin nombre')
    expect(html).toContain('No registrado')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).not.toContain('<p class="mt-4 text-sm">')
  })

  it('tells when the shelter has no pets', () => {
    expect(renderShelterPets([])).toContain(NO_PETS_MESSAGE)
  })

  it('lists the pets with a link to their detail', () => {
    const html = renderShelterPets([
      { id: 1, name: 'Mora', species: 'Perro', breed: 'Criollo', age: 3, status: 'Disponible' },
      { id: null, name: 'Anónimo', species: 'Gato', breed: 'Raza no registrada', age: null, status: 'En proceso de adopcion' },
    ])
    expect(html).toContain('href="./HU33.html?id=1"')
    expect(html).toContain('3 años')
    expect(html).toContain('En proceso de adopción')
    expect(html).toContain('<strong>Anónimo</strong>')
  })
})
