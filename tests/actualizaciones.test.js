
import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  validateUpdate,
  createUpdate,
  getStoredUpdates,
  saveUpdate,
} from '../src/actualizaciones.js'

const validUpdate = {
  targetType: 'mascota',
  targetId: 'MASC-001',
  title: 'Seguimiento de adaptación',
  description: 'La mascota se adapta favorablemente al refugio.',
}

function memoryStorage(initialValue = null) {
  const data = new Map()

  if (initialValue !== null) {
    data.set(STORAGE_KEY, initialValue)
  }

  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value),
  }
}

describe('validateUpdate', () => {
  it('accepts a complete update', () => {
    expect(validateUpdate(validUpdate)).toEqual({})
  })

  it.each([
    ['targetType', 'otro'],
    ['targetId', ''],
    ['title', ''],
    ['description', ''],
  ])('rejects invalid field %s', (field, value) => {
    expect(validateUpdate({ ...validUpdate, [field]: value }))
      .toHaveProperty(field)
  })

  it('rejects missing and non-text values', () => {
    expect(validateUpdate({
      targetType: null,
      targetId: undefined,
      title: 10,
      description: null,
    })).toMatchObject({
      targetType: expect.any(String),
      targetId: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
    })
  })

  it('rejects values containing only spaces', () => {
    expect(validateUpdate({
      ...validUpdate,
      title: '   ',
      description: '   ',
    })).toHaveProperty('title')
  })
})

describe('createUpdate', () => {
  it('creates an update and removes surrounding spaces', () => {
    expect(createUpdate({
      ...validUpdate,
      targetId: ' MASC-001 ',
      title: ' Seguimiento ',
    }, {
      id: 'HU22-001',
      createdAt: '2026-10-26T10:00:00.000Z',
    })).toEqual({
      id: 'HU22-001',
      createdAt: '2026-10-26T10:00:00.000Z',
      targetType: 'mascota',
      targetId: 'MASC-001',
      title: 'Seguimiento',
      description: validUpdate.description,
    })
  })

  it('generates an identifier and timestamp by default', () => {
    const update = createUpdate(validUpdate)

    expect(update.id).toBeTruthy()
    expect(Number.isNaN(Date.parse(update.createdAt))).toBe(false)
  })
})

describe('update persistence', () => {
  it('returns an empty list when storage is empty', () => {
    expect(getStoredUpdates(memoryStorage())).toEqual([])
  })

  it('loads previously saved updates', () => {
    const previous = [{ id: 'HU22-OLD' }]

    expect(getStoredUpdates(
      memoryStorage(JSON.stringify(previous)),
    )).toEqual(previous)
  })

  it('rejects malformed JSON', () => {
    expect(() => getStoredUpdates(memoryStorage('{invalid')))
      .toThrow(SyntaxError)
  })

  it('rejects stored values that are not lists', () => {
    expect(() => getStoredUpdates(memoryStorage('{"id":"HU22-001"}')))
      .toThrow('Las actualizaciones guardadas deben ser una lista.')
  })

  it('saves a new update without removing earlier updates', () => {
    const previous = [{ id: 'HU22-OLD' }]
    const storage = memoryStorage(JSON.stringify(previous))
    const next = { id: 'HU22-NEW' }

    saveUpdate(next, storage)

    expect(getStoredUpdates(storage)).toEqual([...previous, next])
  })
})
