import { describe, expect, it } from 'vitest'
import {
  createSuccessStory,
  deleteSuccessStory,
  getSuccessStories,
  isActivePet,
  PET_REGISTRY_STORAGE_KEY,
  saveSuccessStory,
  SUCCESS_STORIES_STORAGE_KEY,
  updateSuccessStory,
  validateSuccessStory,
} from '../src/workflows/HU05.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

const values = { petId: 'mora', title: 'Un nuevo hogar', description: 'Mora encontró una familia.' }

describe('HU05 adoption success stories', () => {
  it('treats known pets as active unless their registry status is inactive or retired', () => {
    expect(isActivePet('mora', memoryStorage())).toBe(true)
    expect(isActivePet('missing', memoryStorage())).toBe(false)
    expect(isActivePet('mora', memoryStorage({ [PET_REGISTRY_STORAGE_KEY]: JSON.stringify([{ petName: 'Mora', status: 'Inactiva' }]) }))).toBe(false)
    expect(isActivePet('mora', memoryStorage({ [PET_REGISTRY_STORAGE_KEY]: JSON.stringify([{ petId: 'mora', status: 'Retirada' }]) }))).toBe(false)
    expect(isActivePet('mora', memoryStorage({ 'huellitas.petAvailability': JSON.stringify([{ petName: 'Mora', status: 'Adoptada' }]) }))).toBe(true)
  })

  it('lists saved stories and validates pet, title, description and active status', () => {
    expect(getSuccessStories(memoryStorage())).toEqual([])
    expect(validateSuccessStory({}, memoryStorage())).toEqual({
      petId: 'Selecciona una mascota.',
      title: 'Escribe un título para la historia.',
      description: 'Escribe la descripción de la historia.',
    })
    const inactive = memoryStorage({ [PET_REGISTRY_STORAGE_KEY]: JSON.stringify([{ petName: 'Mora', status: 'Inactiva' }]) })
    expect(validateSuccessStory(values, inactive).petId).toBe('Solo se pueden publicar historias de mascotas activas.')
    expect(validateSuccessStory(values, memoryStorage())).toEqual({})
  })

  it('creates a normalized story', () => {
    expect(createSuccessStory({ ...values, title: ' Un hogar ' }, { id: 'story-1', createdAt: 'stamp' })).toEqual({
      id: 'story-1', petId: 'mora', petName: 'Mora', title: 'Un hogar',
      description: 'Mora encontró una familia.', createdAt: 'stamp',
    })
  })

  it('publishes stories and rejects inactive pets and duplicate ids', () => {
    const story = createSuccessStory(values, { id: 'story-1' })
    const storage = memoryStorage()
    saveSuccessStory(storage, story)
    expect(getSuccessStories(storage)).toEqual([story])
    expect(() => saveSuccessStory(storage, story)).toThrow('La historia ya está publicada.')
    const inactive = memoryStorage({ [PET_REGISTRY_STORAGE_KEY]: JSON.stringify([{ petName: 'Mora', status: 'Inactiva' }]) })
    expect(() => saveSuccessStory(inactive, story)).toThrow('Solo se pueden publicar historias de mascotas activas.')
  })

  it('edits existing stories and rejects missing or inactive records', () => {
    const storage = memoryStorage({ [SUCCESS_STORIES_STORAGE_KEY]: JSON.stringify([createSuccessStory(values, { id: 'story-1' })]) })
    expect(updateSuccessStory(storage, 'story-1', { title: 'Nuevo título', description: 'Nueva historia' }))
      .toMatchObject({ title: 'Nuevo título', description: 'Nueva historia' })
    expect(() => updateSuccessStory(storage, 'missing', values)).toThrow('No encontramos la historia que quieres editar.')
    storage.setItem(PET_REGISTRY_STORAGE_KEY, JSON.stringify([{ petName: 'Mora', status: 'Inactiva' }]))
    expect(() => updateSuccessStory(storage, 'story-1', values)).toThrow('Solo se pueden editar historias de mascotas activas.')
  })

  it('deletes an existing story and rejects unknown ids', () => {
    const story = createSuccessStory(values, { id: 'story-1' })
    const storage = memoryStorage({ [SUCCESS_STORIES_STORAGE_KEY]: JSON.stringify([story]) })
    deleteSuccessStory(storage, 'story-1')
    expect(getSuccessStories(storage)).toEqual([])
    expect(() => deleteSuccessStory(storage, 'missing')).toThrow('No encontramos la historia que quieres eliminar.')
  })
})
