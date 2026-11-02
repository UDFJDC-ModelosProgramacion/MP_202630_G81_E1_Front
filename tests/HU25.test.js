
import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_API_URL,
  ReviewsError,
  escapeHtml,
  fetchAllReviews,
  fetchReviewById,
  fetchReviewsByAdopter,
  fetchReviewsByPet,
  fetchReviewsByRating,
  filterReviewsByRating,
  getApiUrl,
  normalizeReview,
  renderReviewCard,
  renderReviewList,
} from '../src/workflows/HU25.js'

const rawReview = {
  id: 1,
  calificacion: 5,
  comentario: 'Excelente experiencia',
  fecha: '2026-10-20',
  mascota: { id: 10, nombre: 'Mora' },
  adoptante: { id: 20, nombre: 'Santiago' },
}

const review = normalizeReview(rawReview)

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body }
}

describe('getApiUrl', () => {
  it('uses the default URL when nothing is configured', () => {
    expect(getApiUrl()).toBe(DEFAULT_API_URL)
    expect(getApiUrl({ VITE_API_URL: '  ' })).toBe(DEFAULT_API_URL)
  })

  it('removes trailing slashes from the configured URL', () => {
    expect(getApiUrl({ VITE_API_URL: 'http://api.test/api///' }))
      .toBe('http://api.test/api')
  })
})

describe('normalizeReview', () => {
  it('normalizes the review received from the API', () => {
    expect(review).toEqual({
      id: 1,
      rating: 5,
      comment: 'Excelente experiencia',
      date: '2026-10-20',
      petId: 10,
      petName: 'Mora',
      adopterId: 20,
      adopterName: 'Santiago',
    })
  })

  it('uses safe defaults when data is missing or invalid', () => {
    expect(normalizeReview({
      calificacion: 8,
      comentario: 5,
    })).toEqual({
      id: null,
      rating: null,
      comment: 'Sin comentario',
      date: 'Fecha no registrada',
      petId: null,
      petName: 'Mascota no registrada',
      adopterId: null,
      adopterName: 'Adoptante no registrado',
    })
  })
})

describe('fetchAllReviews', () => {
  it('requests all reviews', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([rawReview]))

    expect(await fetchAllReviews(fetchFn, 'http://api.test/api')).toEqual([review])
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/api/resenas', {
      headers: { Accept: 'application/json' },
    })
  })

  it('returns an empty list when there are no reviews', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([]))
    expect(await fetchAllReviews(fetchFn)).toEqual([])
  })
})

describe('review filters', () => {
  it('requests reviews by pet', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([rawReview]))
    expect(await fetchReviewsByPet(fetchFn, 10)).toEqual([review])
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/resenas/mascota/10`)
  })

  it('requests reviews by adopter', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([rawReview]))
    expect(await fetchReviewsByAdopter(fetchFn, 20)).toEqual([review])
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/resenas/adoptante/20`)
  })

  it('requests reviews by rating', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([rawReview]))
    expect(await fetchReviewsByRating(fetchFn, 5)).toEqual([review])
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/resenas/calificacion/5`)
  })

  it('rejects invalid pet, adopter and rating filters', async () => {
    const fetchFn = vi.fn()

    await expect(fetchReviewsByPet(fetchFn, 0)).rejects.toThrow('ID de mascota')
    await expect(fetchReviewsByAdopter(fetchFn, -1)).rejects.toThrow('ID de adoptante')
    await expect(fetchReviewsByRating(fetchFn, 6)).rejects.toThrow('entre 1 y 5')
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('filters a list by rating', () => {
    const reviews = [
      review,
      normalizeReview({ ...rawReview, id: 2, calificacion: 3 }),
    ]

    expect(filterReviewsByRating(reviews, 5)).toEqual([review])
    expect(filterReviewsByRating(reviews, '')).toHaveLength(2)
  })
})

describe('fetchReviewById', () => {
  it('requests a review by its ID', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(rawReview))
    expect(await fetchReviewById(fetchFn, 1)).toEqual(review)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/resenas/1`)
  })

  it('reports a review that does not exist', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(null, { ok: false, status: 404 })
    )

    await expect(fetchReviewById(fetchFn, 999))
      .rejects.toMatchObject({ status: 404 })
  })

  it('rejects an invalid review ID', async () => {
    const fetchFn = vi.fn()
    await expect(fetchReviewById(fetchFn, 0)).rejects.toThrow('ID de resena')
    expect(fetchFn).not.toHaveBeenCalled()
  })
})

describe('server errors', () => {
  it('reports network failures', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(fetchAllReviews(fetchFn))
      .rejects.toThrow('No pudimos conectar con el servidor')
  })

  it('reports HTTP errors', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(null, { ok: false, status: 500 })
    )

    const error = await fetchAllReviews(fetchFn).catch((e) => e)
    expect(error).toBeInstanceOf(ReviewsError)
    expect(error.status).toBe(500)
  })

  it('reports unreadable JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError('bad json') },
    })

    await expect(fetchAllReviews(fetchFn)).rejects.toThrow('no se pueden leer')
  })

  it('reports unexpected response formats', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ message: 'error' }))
    await expect(fetchAllReviews(fetchFn)).rejects.toThrow('formato inesperado')
  })
})

describe('rendering', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<b>"Mora" & 'Rocky'</b>`))
      .toBe('&lt;b&gt;&quot;Mora&quot; &amp; &#39;Rocky&#39;&lt;/b&gt;')
  })

  it('renders a review card', () => {
    const html = renderReviewCard(review)
    expect(html).toContain('Mora')
    expect(html).toContain('Excelente experiencia')
    expect(html).toContain('5 / 5 estrellas')
    expect(html).toContain('Santiago')
  })

  it('escapes user content when rendering', () => {
    const malicious = normalizeReview({
      ...rawReview,
      comentario: '<script>alert("x")</script>',
    })

    const html = renderReviewCard(malicious)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('renders a list of reviews', () => {
    expect(renderReviewList([review])).toContain('data-testid="review-card"')
    expect(renderReviewList([])).toBe('')
  })
})
