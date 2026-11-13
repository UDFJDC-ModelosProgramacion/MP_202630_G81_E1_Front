import { describe, expect, it } from 'vitest'
import { getPublicSuccessStories } from '../src/workflows/HU06.js'
import { SUCCESS_STORIES_STORAGE_KEY, PET_REGISTRY_STORAGE_KEY } from '../src/workflows/HU05.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

describe('HU06 public success stories', () => {
  it('distinguishes an unknown or inactive pet from one with no stories', () => {
    expect(getPublicSuccessStories(memoryStorage(), 'missing').status).toBe('not-found')
    const inactive = memoryStorage({ [PET_REGISTRY_STORAGE_KEY]: JSON.stringify([{ petName: 'Mora', status: 'Inactiva' }]) })
    expect(getPublicSuccessStories(inactive, 'mora')).toMatchObject({ status: 'inactive', pet: { name: 'Mora' }, stories: [] })
    expect(getPublicSuccessStories(memoryStorage(), 'mora')).toMatchObject({ status: 'empty', pet: { name: 'Mora' }, stories: [] })
  })

  it('returns only the selected pet stories in newest-first order', () => {
    const storage = memoryStorage({
      [SUCCESS_STORIES_STORAGE_KEY]: JSON.stringify([
        { id: 'old', petId: 'mora', createdAt: '2026-01-01T10:00:00.000Z' },
        { id: 'other', petId: 'luna', createdAt: '2026-04-01T10:00:00.000Z' },
        { id: 'new', petId: 'mora', createdAt: '2026-03-01T10:00:00.000Z' },
      ]),
    })
    expect(getPublicSuccessStories(storage, 'mora').stories.map((story) => story.id)).toEqual(['new', 'old'])
  })
})