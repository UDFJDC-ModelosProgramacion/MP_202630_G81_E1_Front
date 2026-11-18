import { describe, expect, it, vi } from 'vitest'
import {
  ALL_FILTER,
  DEFAULT_API_URL,
  PET_NOT_FOUND,
  describeResults,
  escapeHtml,
  fetchPet,
  fetchPets,
  filterPets,
  formatAge,
  getApiUrl,
  getSpeciesOptions,
  normalizePet,
  parsePetRoute,
  renderPetCard,
  renderPetDetail,
  renderPetList,
  statusLabel,
} from '../src/catalog/catalog.js'
import { ApiError } from '../src/api-client.js'

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

const GET_OPTIONS = { method: 'GET', headers: { Accept: 'application/json' } }

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
      shelterId: 7,
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
      status: 'Estado no registrado',
      shelterId: null,
      shelterName: 'Refugio no registrado',
      shelterCity: '',
    })
  })

  it('does not present a pet without a status as available', () => {
    expect(normalizePet({ nombre: 'Luna' }).status).not.toBe('Disponible')
  })

  it('keeps an age of zero', () => {
    expect(normalizePet({ edad: 0 }).age).toBe(0)
  })
})

describe('fetchPets', () => {
  it('requests the pets endpoint and returns normalized pets', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([rawMora]))

    const result = await fetchPets(fetchFn, 'http://api.test/api')

    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/mascotas', GET_OPTIONS)
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
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(500)
    expect(error.message).toContain('no pudo entregar el catálogo')
  })

  it('shows the message the back-end sends when it rejects the request', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ apierror: { message: 'Base de datos fuera de servicio' } }, { ok: false, status: 503 }))
    await expect(fetchPets(fetchFn)).rejects.toThrow('Base de datos fuera de servicio')
  })

  it('reports unreadable JSON as an unexpected format', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('bad json') },
    })
    await expect(fetchPets(fetchFn)).rejects.toThrow('formato inesperado')
  })

  it('reports responses that are not a list', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ message: 'nope' }))
    await expect(fetchPets(fetchFn)).rejects.toThrow('formato inesperado')
  })

  it('treats a 404 on the list as a generic server error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 404 }))
    const error = await fetchPets(fetchFn).catch((e) => e)
    expect(error.status).toBe(404)
    expect(error.message).toContain('no pudo entregar el catálogo')
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

  it('filters by species ignoring case, spaces and accents', () => {
    const mixed = [
      normalizePet({ id: 1, nombre: 'A', especie: 'perro' }),
      normalizePet({ id: 2, nombre: 'B', especie: ' PERRO ' }),
      normalizePet({ id: 3, nombre: 'C', especie: 'Gato' }),
    ]
    expect(filterPets(mixed, { species: 'Perro' }).map((p) => p.name)).toEqual(['A', 'B'])
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

  it('lists species written with different case or accents only once', () => {
    const mixed = ['Perro', 'perro', 'PERRO', 'Gato', 'gato'].map((especie) => normalizePet({ especie }))
    expect(getSpeciesOptions(mixed)).toEqual(['Gato', 'Perro'])
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
    expect(html).not.toContain('pet-note')
    expect(html).not.toContain('Ver detalle')
    expect(html).toContain('Refugio no registrado')
  })

  it('renders a list of cards', () => {
    expect(renderPetList(pets).match(/data-testid="pet-card"/g)).toHaveLength(3)
    expect(renderPetList([])).toBe('')
  })

  it('describes how many pets are shown', () => {
    expect(describeResults(0, 0)).toBe('No hay mascotas disponibles.')
    expect(describeResults(1, 1)).toBe('Mostrando 1 mascota')
    expect(describeResults(3, 3)).toBe('Mostrando 3 mascotas')
    expect(describeResults(1, 3)).toBe('Mostrando 1 de 3 mascotas')
  })
})

describe('fetchPet', () => {
  it('requests one pet by id and returns it normalized', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(rawMora))
    const pet = await fetchPet(fetchFn, '1', 'http://api.test/api')
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/mascotas/1', GET_OPTIONS)
    expect(pet).toEqual(pets[0])
  })

  it('uses the default API URL when none is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(rawMora))
    await fetchPet(fetchFn, 1)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/mascotas/1`)
  })

  it('reports that the pet was not found when the id does not exist', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 404 }))
    const error = await fetchPet(fetchFn, '999').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
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

describe('parsePetRoute', () => {
  it('shows the catalog when there is no id', () => {
    expect(parsePetRoute()).toEqual({ detail: false, id: null })
    expect(parsePetRoute('?otro=1')).toEqual({ detail: false, id: null })
  })

  it('shows the detail with a numeric id', () => {
    expect(parsePetRoute('?id=12')).toEqual({ detail: true, id: '12' })
  })

  it('shows the detail with an invalid id so the not found message appears', () => {
    expect(parsePetRoute('?id=abc')).toEqual({ detail: true, id: null })
    expect(parsePetRoute('?id=-3')).toEqual({ detail: true, id: null })
  })
})

describe('pet detail rendering', () => {
  it('links every card with an id to its detail', () => {
    const html = renderPetCard(pets[0])
    expect(html).toContain('href="./HU33.html?id=1"')
    expect(html).toContain('aria-label="Ver detalle de Mora"')
  })

  it('renders every field of the pet', () => {
    const html = renderPetDetail(pets[0])
    for (const text of ['Mora', 'Perro', 'Criollo', '3 años', 'Hembra', 'Mediano', 'Juguetona', 'Huellitas · Bogotá']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('data-testid="pet-detail"')
  })

  it('links the detail to the shelter page (HU31) when the shelter is known', () => {
    expect(renderPetDetail(pets[0])).toContain('href="./HU31.html?id=7"')
  })

  it('shows placeholders for missing data, escapes user text and has no shelter link', () => {
    const html = renderPetDetail(normalizePet({ nombre: '<b>x</b>' }))
    expect(html).not.toContain('<b>x</b>')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).toContain('No registrado')
    expect(html).toContain('Edad no registrada')
    expect(html).toContain('Refugio no registrado')
    expect(html).not.toContain('HU31.html')
  })
})
