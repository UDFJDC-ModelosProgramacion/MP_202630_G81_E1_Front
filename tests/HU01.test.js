import { describe, expect, it } from 'vitest'
import { getPetGallery } from '../src/gallery.js'

describe('getPetGallery', () => {
  it('returns every photo with the main photo first', () => {
    const gallery = getPetGallery('mora')

    expect(gallery.status).toBe('available')
    expect(gallery.photos).toHaveLength(3)
    expect(gallery.photos[0].principal).toBe(true)
  })

  it('reports when a pet has no registered photos', () => {
    expect(getPetGallery('luna')).toMatchObject({
      status: 'empty',
      pet: { name: 'Luna' },
      photos: [],
    })
  })

  it('reports when the pet does not exist', () => {
    expect(getPetGallery('desconocida')).toEqual({
      status: 'not-found',
      pet: null,
      photos: [],
    })
  })
})