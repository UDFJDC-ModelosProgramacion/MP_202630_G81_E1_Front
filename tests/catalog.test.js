import { describe, expect, it, vi } from 'vitest'
import {
  ALL_FILTER,
  CatalogError,
  DEFAULT_API_URL,
  describeResults,
  escapeHtml,
  fetchPets,
  filterPets,
  formatAge,
  getApiUrl,
  getSpeciesOptions,
  normalizePet,
  renderPetCard,
  renderPetList,
  statusLabel,
} from '../src/catalog/catalog.js'

const rawMora = {
  id: 1,
  nombre: ' Mora ',
  especie: 'Perro',
  raza: 'Criollo',
  edad: 3,
  sexo: 'Hembra',
  tamano: 'Mediano',
  temperamento: 'Juguetona',
  estado: 'Disponible',
  refugio: { id: 7, nombre: 'Huellitas', ciudad: 'Bogotá' },
}

const pets = [
  normalizePet(rawMora),
  normalizePet({ ...rawMora, id: 2, nombre: 'Félix', especie: 'Gato', raza: 'Siamés', estado: 'Adoptado' }),
  normalizePet({ ...rawMora, id: 3, nombre: 'Rocky', raza: 'Labrador', estado: 'En proceso de adopcion' }),
]

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body }
}

describe('getApiUrl', () => {
  it('uses the default URL when nothing is configured', () => {
    expect(getApiUrl()).toBe(DEFAULT_API_URL)
    expect(getApiUrl({ VITE_API_URL: '   ' })).toBe(DEFAULT_API_URL)
    expect(getApiUrl({ VITE_API_URL: 42 })).toBe(DEFAULT_API_URL)
  })

  it('uses the configured URL without trailing slashes', () => {
    expect(getApiUrl({ VITE_API_URL: 'http://10.0.0.5:8999/api//' })).toBe('http://10.0.0.5:8999/api')
  })
})

describe('normalizePet', () => {
  it('maps and trims the fields sent by the API', () => {
    expect(pets[0]).toEqual({
      id: 1,
      name: 'Mora',
      species: 'Perro',
      breed: 'Criollo',
      age: 3,
      sex: 'Hembra',
      size: 'Mediano',
      temperament: 'Juguetona',
      status: 'Disponible',
      shelterName: 'Huellitas',
      shelterCity: 'Bogotá',
    })
  })

  it('uses safe defaults for missing or invalid data', () => {
    expect(normalizePet({ edad: -2, nombre: 5 })).toEqual({
      id: null,
      name: 'Sin nombre',
      species: 'Sin especie',
      breed: 'Raza no registrada',
      age: null,
      sex: '',
      size: '',
      temperament: '',
      status: 'Disponible',
      shelterName: 'Refugio no registrado',
      shelterCity: '',
    })
  })

  it('keeps an age of zero', () => {
    expect(normalizePet({ edad: 0 }).age).toBe(0)
  })
})

describe('fetchPets', () => {
  it('requests the pets endpoint and returns normalized pets', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([rawMora]))

    const result = await fetchPets(fetchFn, 'http://api.test/api')

    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/mascotas', {
      headers: { Accept: 'application/json' },
    })
    expect(result).toEqual([pets[0]])
  })

  it('uses the default API URL when none is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([]))
    await fetchPets(fetchFn)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/mascotas`)
  })

  it('reports network failures', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(fetchPets(fetchFn)).rejects.toThrow('No pudimos conectar con el servidor')
  })

  it('reports HTTP errors with their status', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 }))
    const error = await fetchPets(fetchFn).catch((e) => e)
    expect(error).toBeInstanceOf(CatalogError)
    expect(error.status).toBe(500)
    expect(error.message).toContain('no pudo entregar el catálogo')
  })

  it('reports unreadable JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('bad json') },
    })
    await expect(fetchPets(fetchFn)).rejects.toThrow('no se pueden leer')
  })

  it('reports responses that are not a list', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ message: 'nope' }))
    await expect(fetchPets(fetchFn)).rejects.toThrow('formato inesperado')
  })
})

describe('formatAge', () => {
  it('describes every age case', () => {
    expect(formatAge(null)).toBe('Edad no registrada')
    expect(formatAge(0)).toBe('Menos de 1 año')
    expect(formatAge(1)).toBe('1 año')
    expect(formatAge(4)).toBe('4 años')
  })
})

describe('filterPets', () => {
  it('returns every pet without filters', () => {
    expect(filterPets(pets)).toHaveLength(3)
    expect(filterPets(pets, { species: ALL_FILTER, status: ALL_FILTER, search: '' })).toHaveLength(3)
  })

  it('filters by species and by status', () => {
    expect(filterPets(pets, { species: 'Gato' }).map((p) => p.name)).toEqual(['Félix'])
    expect(filterPets(pets, { status: 'Disponible' }).map((p) => p.name)).toEqual(['Mora'])
    expect(filterPets(pets, { species: 'Perro', status: 'Adoptado' })).toEqual([])
  })

  it('searches by name, breed or species ignoring case and accents', () => {
    expect(filterPets(pets, { search: 'felix' }).map((p) => p.name)).toEqual(['Félix'])
    expect(filterPets(pets, { search: '  LABRADOR ' }).map((p) => p.name)).toEqual(['Rocky'])
    expect(filterPets(pets, { search: 'gato' }).map((p) => p.name)).toEqual(['Félix'])
    expect(filterPets(pets, { search: 'zzz' })).toEqual([])
  })
})

describe('getSpeciesOptions', () => {
  it('returns unique species sorted alphabetically', () => {
    expect(getSpeciesOptions(pets)).toEqual(['Gato', 'Perro'])
    expect(getSpeciesOptions([])).toEqual([])
  })
})

describe('rendering', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<b>"Tom" & 'Jerry'</b>`)).toBe('&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;')
  })

  it('translates the status that has no accent in the API', () => {
    expect(statusLabel('En proceso de adopcion')).toBe('En proceso de adopción')
    expect(statusLabel('Disponible')).toBe('Disponible')
  })

  it('renders a card with the main pet data', () => {
    const html = renderPetCard(pets[0])
    expect(html).toContain('Mora')
    expect(html).toContain('Criollo · 3 años · Hembra · Mediano')
    expect(html).toContain('Juguetona')
    expect(html).toContain('Huellitas · Bogotá')
  })

  it('omits optional data that is not available and escapes user text', () => {
    const html = renderPetCard(normalizePet({ nombre: '<script>x</script>', especie: 'Perro' }))
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Edad no registrada')
    expect(html).not.toContain('text-stone-600')
    expect(html).toContain('Refugio no registrado')
  })

  it('renders a list of cards', () => {
    expect(renderPetList(pets).match(/data-testid="pet-card"/g)).toHaveLength(3)
    expect(renderPetList([])).toBe('')
  })

  it('describes how many pets are shown', () => {
    expect(describeResults(0, 0)).toBe('Aún no hay mascotas registradas.')
    expect(describeResults(1, 1)).toBe('Mostrando 1 mascota')
    expect(describeResults(3, 3)).toBe('Mostrando 3 mascotas')
    expect(describeResults(1, 3)).toBe('Mostrando 1 de 3 mascotas')
  })
})
