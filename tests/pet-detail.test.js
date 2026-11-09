import { describe, expect, it, vi } from 'vitest'
import {
  CatalogError,
  DEFAULT_API_URL,
  PET_NOT_FOUND,
  fetchPet,
  fetchPets,
  normalizePet,
  parsePetId,
  renderPetCard,
  renderPetDetail,
} from '../src/catalog/catalog.js'

const rawMora = {
  id: 1,
  nombre: 'Mora',
  especie: 'Perro',
  raza: 'Criollo',
  edad: 3,
  sexo: 'Hembra',
  tamano: 'Mediano',
  temperamento: 'Juguetona',
  estado: 'Disponible',
  refugio: { id: 7, nombre: 'Huellitas', ciudad: 'Bogotá' },
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body }
}

describe('fetchPet', () => {
  it('requests one pet by id and returns it normalized', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(rawMora))

    const pet = await fetchPet(fetchFn, '1', 'http://api.test/api')

    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/mascotas/1', {
      headers: { Accept: 'application/json' },
    })
    expect(pet).toEqual(normalizePet(rawMora))
  })

  it('uses the default API URL when none is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(rawMora))
    await fetchPet(fetchFn, 1)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/mascotas/1`)
  })

  it('reports that the pet was not found when the id does not exist', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 404 }))
    const error = await fetchPet(fetchFn, '999').catch((e) => e)
    expect(error).toBeInstanceOf(CatalogError)
    expect(error.message).toBe(PET_NOT_FOUND)
    expect(error.status).toBe(404)
  })

  it('reports other HTTP errors with their status', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 500 }))
    const error = await fetchPet(fetchFn, '1').catch((e) => e)
    expect(error.status).toBe(500)
    expect(error.message).toContain('no pudo entregar')
  })

  it('reports network failures', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(fetchPet(fetchFn, '1')).rejects.toThrow('No pudimos conectar con el servidor')
  })

  it('reports responses that are not a single pet', async () => {
    for (const body of [null, 'texto', []]) {
      const fetchFn = vi.fn().mockResolvedValue(jsonResponse(body))
      await expect(fetchPet(fetchFn, '1')).rejects.toThrow('formato inesperado')
    }
  })
})

describe('fetchPets with a 404', () => {
  it('treats a 404 on the list as a generic server error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 404 }))
    const error = await fetchPets(fetchFn).catch((e) => e)
    expect(error.status).toBe(404)
    expect(error.message).toContain('no pudo entregar el catálogo')
  })
})

describe('parsePetId', () => {
  it('reads a numeric id from the query string', () => {
    expect(parsePetId('?id=12')).toBe('12')
  })

  it('returns null when the id is missing or invalid', () => {
    expect(parsePetId()).toBeNull()
    expect(parsePetId('')).toBeNull()
    expect(parsePetId('?id=abc')).toBeNull()
    expect(parsePetId('?id=-3')).toBeNull()
  })
})

describe('pet detail rendering', () => {
  it('links every card with an id to its detail page', () => {
    const html = renderPetCard(normalizePet(rawMora))
    expect(html).toContain('href="/mascota.html?id=1"')
    expect(html).toContain('aria-label="Ver detalle de Mora"')
  })

  it('renders every field of the pet', () => {
    const html = renderPetDetail(normalizePet(rawMora))
    for (const text of ['Mora', 'Perro', 'Criollo', '3 años', 'Hembra', 'Mediano', 'Juguetona', 'Huellitas · Bogotá']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('data-testid="pet-detail"')
  })

  it('shows placeholders for missing data and escapes user text', () => {
    const html = renderPetDetail(normalizePet({ nombre: '<b>x</b>' }))
    expect(html).not.toContain('<b>x</b>')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).toContain('No registrado')
    expect(html).toContain('Edad no registrada')
    expect(html).toContain('Refugio no registrado')
  })
})
