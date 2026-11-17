import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_API_URL,
  ResenaError,
  buildReviewPayload,
  createReview,
  fetchAdopters,
  fetchPets,
  fetchReviews,
  getApiUrl,
  normalizeAdopter,
  normalizePet,
  normalizeReview,
  updateReview,
  validateReview,
} from '../src/workflows/HU24.js'

const validReview = {
  calificacion: '5',
  comentario: 'Excelente experiencia',
  fecha: '2026-10-26',
  mascotaId: '1',
  adoptanteId: '2',
}

const pet = {
  id: 1,
  nombre: 'Mora',
  especie: 'Perro',
}

const adopter = {
  id: 2,
  nombre: 'Ana',
  apellido: 'Pérez',
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  }
}

describe('getApiUrl', () => {
  it('uses the default URL when there is no configuration', () => {
    expect(getApiUrl()).toBe(DEFAULT_API_URL)
    expect(getApiUrl({ VITE_API_URL: '' })).toBe(DEFAULT_API_URL)
    expect(getApiUrl({ VITE_API_URL: '   ' })).toBe(DEFAULT_API_URL)
    expect(getApiUrl({ VITE_API_URL: 123 })).toBe(DEFAULT_API_URL)
  })

  it('uses the configured URL and removes trailing slashes', () => {
    expect(getApiUrl({ VITE_API_URL: ' http://localhost:8080/api/// ' }))
      .toBe('http://localhost:8080/api')
  })
})

describe('validateReview', () => {
  it('accepts valid review data', () => {
    expect(validateReview(validReview)).toEqual({})
  })

  it('rejects ratings outside the range from one to five', () => {
    expect(validateReview({ ...validReview, calificacion: '0' }).calificacion)
      .toBe('La calificación debe estar entre 1 y 5.')
    expect(validateReview({ ...validReview, calificacion: '6' }).calificacion)
      .toBe('La calificación debe estar entre 1 y 5.')
    expect(validateReview({ ...validReview, calificacion: '2.5' }).calificacion)
      .toBe('La calificación debe estar entre 1 y 5.')
    expect(validateReview({ ...validReview, calificacion: '' }).calificacion)
      .toBe('La calificación debe estar entre 1 y 5.')
  })

  it('rejects an empty comment', () => {
    expect(validateReview({ ...validReview, comentario: '   ' }).comentario)
      .toBe('Escribe un comentario para la reseña.')
    expect(validateReview({ ...validReview, comentario: null }).comentario)
      .toBe('Escribe un comentario para la reseña.')
  })

  it('rejects a missing or invalid date', () => {
    expect(validateReview({ ...validReview, fecha: '' }).fecha)
      .toBe('Selecciona una fecha válida.')
    expect(validateReview({ ...validReview, fecha: 'fecha-invalida' }).fecha)
      .toBe('Selecciona una fecha válida.')
    expect(validateReview({ ...validReview, fecha: null }).fecha)
      .toBe('Selecciona una fecha válida.')
  })

  it('requires a valid pet identifier', () => {
    expect(validateReview({ ...validReview, mascotaId: '' }).mascotaId)
      .toBe('Selecciona una mascota válida.')
    expect(validateReview({ ...validReview, mascotaId: 'abc' }).mascotaId)
      .toBe('Selecciona una mascota válida.')
    expect(validateReview({ ...validReview, mascotaId: '0' }).mascotaId)
      .toBe('Selecciona una mascota válida.')
  })

  it('allows an optional adopter', () => {
    expect(validateReview({ ...validReview, adoptanteId: '' })).toEqual({})
    expect(validateReview({ ...validReview, adoptanteId: null })).toEqual({})
  })

  it('rejects an invalid adopter identifier when supplied', () => {
    expect(validateReview({ ...validReview, adoptanteId: 'abc' }).adoptanteId)
      .toBe('Selecciona un adoptante válido.')
    expect(validateReview({ ...validReview, adoptanteId: '0' }).adoptanteId)
      .toBe('Selecciona un adoptante válido.')
  })
})

describe('buildReviewPayload', () => {
  it('builds the API payload with pet and adopter identifiers', () => {
    expect(buildReviewPayload(validReview)).toEqual({
      calificacion: 5,
      comentario: 'Excelente experiencia',
      fecha: '2026-10-26',
      mascota: { id: 1 },
      adoptante: { id: 2 },
    })
  })

  it('allows a review without an adopter', () => {
    expect(buildReviewPayload({ ...validReview, adoptanteId: '' }).adoptante)
      .toBeNull()
    expect(buildReviewPayload({ ...validReview, adoptanteId: null }).adoptante)
      .toBeNull()
  })
})

describe('normalizePet', () => {
  it('normalizes a pet from the API', () => {
    expect(normalizePet(pet)).toEqual({
      id: 1,
      name: 'Mora',
      species: 'Perro',
    })
  })

  it('uses default values when pet information is missing', () => {
    expect(normalizePet({ id: 3, nombre: '  ' })).toEqual({
      id: 3,
      name: 'Mascota sin nombre',
      species: 'Especie no registrada',
    })
  })

  it('uses null when pet ID is missing', () => {
    expect(normalizePet({
      nombre: 'Mora',
      especie: 'Perro',
    })).toEqual({
      id: null,
      name: 'Mora',
      species: 'Perro',
    })
  })
})

describe('normalizeAdopter', () => {
  it('combines the adopter name and surname', () => {
    expect(normalizeAdopter(adopter)).toEqual({
      id: 2,
      name: 'Ana Pérez',
    })
  })

  it('uses the full name when the first name is unavailable', () => {
    expect(normalizeAdopter({ id: 3, nombreCompleto: 'Luis Gómez' }).name)
      .toBe('Luis Gómez')
  })

  it('uses a default name when no name is available', () => {
    expect(normalizeAdopter({ id: 4 }).name).toBe('Adoptante 4')
  })

  it('normalizes missing and invalid adopter information', () => {
    expect(normalizeAdopter({
      nombre: ' ',
      apellido: null,
      apellidos: 123,
    })).toEqual({
      id: null,
      name: 'Adoptante ',
    })

    expect(normalizeAdopter({
      nombre: 'Juan',
      apellido: ' ',
      apellidos: 'Gomez',
    })).toEqual({
      id: null,
      name: 'Juan Gomez',
    })
  })
    it('uses empty fallback when adopter ID is null', () => {
    expect(normalizeAdopter({
      id: null,
    })).toEqual({
      id: null,
      name: 'Adoptante ',
    })
  })
  it('uses fallback when full name is empty', () => {
  expect(normalizeAdopter({
    id: 5,
    nombreCompleto: '   ',
  })).toEqual({
    id: 5,
    name: 'Adoptante 5',
  })
})
  it('uses fallback when adopter ID is zero', () => {
  expect(normalizeAdopter({
    id: 0,
  })).toEqual({
    id: 0,
    name: 'Adoptante 0',
  })
})
  it('uses null when adopter ID is undefined', () => {
  expect(normalizeAdopter({
    id: undefined,
    nombre: 'Carlos',
  })).toEqual({
    id: null,
    name: 'Carlos',
  })
})
})

describe('normalizeReview', () => {
  it('normalizes a review with pet and adopter information', () => {
    expect(normalizeReview({
      id: 10,
      calificacion: 5,
      comentario: 'Muy buena experiencia',
      fecha: '2026-10-26',
      mascota: { id: 1, nombre: 'Mora' },
      adoptante: { id: 2, nombre: 'Ana', apellido: 'Pérez' },
    })).toEqual({
      id: 10,
      rating: 5,
      comment: 'Muy buena experiencia',
      date: '2026-10-26',
      petId: 1,
      petName: 'Mora',
      adopterId: 2,
      adopterName: 'Ana Pérez',
    })
  })

  it('normalizes a review without an adopter', () => {
    expect(normalizeReview({
      id: 11,
      calificacion: 4,
      comentario: 'Buena experiencia',
      fecha: '2026-10-27',
      mascotaId: 3,
      adoptante: null,
    })).toEqual({
      id: 11,
      rating: 4,
      comment: 'Buena experiencia',
      date: '2026-10-27',
      petId: 3,
      petName: 'Mascota',
      adopterId: null,
      adopterName: 'No especificado',
    })
  })

  it('uses default names when relationship names are unavailable', () => {
    expect(normalizeReview({
      id: 12,
      mascota: {},
      adoptante: { id: 8 },
    })).toMatchObject({
      petName: 'Mascota',
      adopterName: 'Adoptante',
    })
  })
    it('uses alternative IDs when relationships have no IDs', () => {
    expect(normalizeReview({
      mascota: {},
      mascotaId: 7,
      adoptante: {},
      adoptanteId: 9,
    })).toMatchObject({
      petId: 7,
      adopterId: 9,
      petName: 'Mascota',
      adopterName: 'Adoptante',
    })
  })

  it('uses default values when review information is missing', () => {
    expect(normalizeReview({})).toEqual({
      id: null,
      rating: null,
      comment: '',
      date: '',
      petId: null,
      petName: 'Mascota',
      adopterId: null,
      adopterName: 'No especificado',
    })
  })

  it('normalizes an adopter with only the last surname', () => {
    expect(normalizeReview({
      adoptante: {
        id: 3,
        apellidos: 'Gomez',
      },
    }).adopterName).toBe('Gomez')
  })

  it('ignores empty or invalid adopter name fields', () => {
    expect(normalizeReview({
      adoptante: {
        nombre: ' ',
        apellido: null,
        apellidos: 123,
      },
    }).adopterName).toBe('Adoptante')
  })

  it('normalizes an adopter with all name fields', () => {
    expect(normalizeReview({
      adoptante: {
        nombre: 'Ana',
        apellido: 'Maria',
        apellidos: 'Perez',
      },
    }).adopterName).toBe('Ana Maria Perez')
  })

})

describe('fetchPets', () => {
  it('requests and normalizes pets', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([pet]))

    await expect(fetchPets(fetchFn, 'http://api.test/api'))
      .resolves.toEqual([normalizePet(pet)])

    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/mascotas', {
      headers: { Accept: 'application/json' },
    })
  })

  it('uses the default URL', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([]))
    await fetchPets(fetchFn)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/mascotas`)
  })
})

describe('fetchAdopters', () => {
  it('requests and normalizes adopters', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([adopter]))

    await expect(fetchAdopters(fetchFn, 'http://api.test/api'))
      .resolves.toEqual([normalizeAdopter(adopter)])

    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/adoptantes', {
      headers: { Accept: 'application/json' },
    })
  })
})

describe('fetchReviews', () => {
  it('requests and normalizes reviews', async () => {
    const review = {
      id: 10,
      calificacion: 5,
      comentario: 'Excelente',
      fecha: '2026-10-26',
      mascota: { id: 1, nombre: 'Mora' },
      adoptante: null,
    }

    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([review]))

    await expect(fetchReviews(fetchFn, 'http://api.test/api'))
      .resolves.toEqual([normalizeReview(review)])

    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/resenas', {
      headers: { Accept: 'application/json' },
    })
  })
})

describe('API errors', () => {
  it('reports a network error', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Network error'))

    await expect(fetchPets(fetchFn))
      .rejects.toThrow('No pudimos conectar con el servidor')
  })

  it('reports the message returned by apiError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({
      apiError: { message: 'La mascota asociada a la reseña no existe' },
    }, { ok: false, status: 404 }))

    await expect(fetchPets(fetchFn))
      .rejects.toThrow('La mascota asociada a la reseña no existe')
  })

  it('reports a regular API message', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({
      message: 'Error del servidor',
    }, { ok: false, status: 500 }))

    await expect(fetchPets(fetchFn)).rejects.toThrow('Error del servidor')
  })

  it('uses a generic message when the API does not provide one', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, {
      ok: false,
      status: 500,
    }))

    await expect(fetchPets(fetchFn))
      .rejects.toThrow('No fue posible completar la operación.')
  })

  it('rejects a response that is not a list', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }))

    await expect(fetchPets(fetchFn))
      .rejects.toThrow('formato inesperado')
  })

  it('handles an unreadable successful response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Invalid JSON') },
    })

    await expect(fetchPets(fetchFn))
      .rejects.toThrow('formato inesperado')
  })

  it('handles an unreadable error response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new SyntaxError('Invalid JSON') },
    })

    await expect(fetchPets(fetchFn))
      .rejects.toThrow('No fue posible completar la operación.')
  })
})

describe('createReview', () => {
  it('sends a valid review to the API', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 20 }, {
      status: 201,
    }))

    await expect(createReview(validReview, fetchFn, 'http://api.test/api'))
      .resolves.toEqual({ id: 20 })

    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/resenas', {
      method: 'POST',
      body: JSON.stringify(buildReviewPayload(validReview)),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  })

  it('rejects invalid data before calling the API', async () => {
    const fetchFn = vi.fn()

    await expect(createReview({
      ...validReview,
      calificacion: '8',
    }, fetchFn)).rejects.toThrow('La calificación debe estar entre 1 y 5.')

    expect(fetchFn).not.toHaveBeenCalled()
  })
})

describe('updateReview', () => {
  it('updates an existing review', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 20 }))

    await expect(updateReview(20, validReview, fetchFn, 'http://api.test/api'))
      .resolves.toEqual({ id: 20 })

    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/resenas/20', {
      method: 'PUT',
      body: JSON.stringify(buildReviewPayload(validReview)),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  })

  it('rejects an invalid review identifier', async () => {
    const fetchFn = vi.fn()

    await expect(updateReview(0, validReview, fetchFn))
      .rejects.toThrow('Selecciona una reseña válida.')

    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('rejects invalid data before calling the API', async () => {
    const fetchFn = vi.fn()

    await expect(updateReview(20, {
      ...validReview,
      calificacion: '0',
    }, fetchFn)).rejects.toThrow('La calificación debe estar entre 1 y 5.')

    expect(fetchFn).not.toHaveBeenCalled()
  })
})