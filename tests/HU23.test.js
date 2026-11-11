import { describe, expect, it } from 'vitest'
import {
  UPDATES_STORAGE_KEY,
  filterUpdates,
  findUpdateById,
  getStoredUpdates,
} from '../src/workflows/HU23.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))

  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

const updates = [
  {
    id: 'HU22-001',
    createdAt: '2026-10-26T10:00:00.000Z',
    targetType: 'mascota',
    targetId: 'MASC-001',
    title: 'Seguimiento de adaptación',
    description: 'La mascota se adapta favorablemente.',
  },
  {
    id: 'HU22-002',
    createdAt: '2026-10-27T10:00:00.000Z',
    targetType: 'adoptante',
    targetId: 'ADOP-001',
    title: 'Seguimiento del adoptante',
    description: 'Se realizó una llamada de seguimiento.',
  },
  {
    id: 'HU22-003',
    createdAt: '2026-10-28T10:00:00.000Z',
    targetType: 'mascota',
    targetId: 'MASC-002',
    title: 'Control veterinario',
    description: 'Se realizó el control veterinario.',
  },
]

describe('getStoredUpdates', () => {
  it('returns an empty list when there are no stored updates', () => {
    expect(getStoredUpdates(memoryStorage())).toEqual([])
  })

  it('returns the updates stored by HU22', () => {
    const storage = memoryStorage({
      [UPDATES_STORAGE_KEY]: JSON.stringify(updates),
    })

    expect(getStoredUpdates(storage)).toEqual(updates)
  })

  it('throws an error when stored JSON is invalid', () => {
    const storage = memoryStorage({
      [UPDATES_STORAGE_KEY]: '{invalid',
    })

    expect(() => getStoredUpdates(storage)).toThrow(SyntaxError)
  })

  it('throws an error when stored data is not a list', () => {
    const storage = memoryStorage({
      [UPDATES_STORAGE_KEY]: '{"id":"HU22-001"}',
    })

    expect(() => getStoredUpdates(storage)).toThrow(
      'Las actualizaciones guardadas deben ser una lista.',
    )
  })
})

describe('filterUpdates', () => {
  it('returns all updates without filters', () => {
    expect(filterUpdates(updates)).toEqual(updates)
  })

  it('filters updates by target type', () => {
    expect(filterUpdates(updates, { type: 'mascota' })).toEqual([
      updates[0],
      updates[2],
    ])
  })

  it('filters updates by adopter type', () => {
    expect(filterUpdates(updates, { type: 'adoptante' })).toEqual([
      updates[1],
    ])
  })

  it('filters updates by a specific pet identifier', () => {
    expect(filterUpdates(updates, { petId: 'MASC-001' })).toEqual([
      updates[0],
    ])
  })

  it('filters updates by a specific adopter identifier', () => {
    expect(filterUpdates(updates, { adopterId: 'ADOP-001' })).toEqual([
      updates[1],
    ])
  })

  it('ignores letter case and surrounding spaces in identifiers', () => {
    expect(filterUpdates(updates, { petId: ' masc-001 ' })).toEqual([
      updates[0],
    ])
  })

  it('combines type and identifier filters', () => {
    expect(filterUpdates(updates, {
      type: 'mascota',
      petId: 'MASC-002',
    })).toEqual([updates[2]])
  })

  it('returns an empty list when filters do not match', () => {
    expect(filterUpdates(updates, {
      type: 'adoptante',
      petId: 'MASC-001',
    })).toEqual([])
  })

  it('ignores non-text identifiers', () => {
    expect(filterUpdates(updates, {
      petId: null,
      adopterId: 10,
    })).toEqual(updates)
  })
})

describe('findUpdateById', () => {
  it('finds an update by its identifier', () => {
    expect(findUpdateById(updates, 'HU22-001')).toEqual(updates[0])
  })

  it('returns null when the identifier does not exist', () => {
    expect(findUpdateById(updates, 'HU22-999')).toBeNull()
  })

  it('returns null when the identifier is empty', () => {
    expect(findUpdateById(updates, '   ')).toBeNull()
  })

  it('returns null when the identifier is not text', () => {
    expect(findUpdateById(updates, null)).toBeNull()
  })

  it('ignores surrounding spaces in the identifier', () => {
    expect(findUpdateById(updates, ' HU22-001 ')).toEqual(updates[0])
  })
})