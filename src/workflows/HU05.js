import { pets } from '../gallery.js'
import { readCollection } from './storage.js'

export const SUCCESS_STORIES_STORAGE_KEY = 'huellitas.successStories'
export const PET_REGISTRY_STORAGE_KEY = 'huellitas.petRegistry'

const clean = (value) => typeof value === 'string' ? value.trim() : ''

export function isActivePet(petId, storage) {
  const pet = pets.find((item) => item.id === petId)
  if (!pet) return false
  const registry = readCollection(storage, PET_REGISTRY_STORAGE_KEY)
    .find((item) => item.petId === petId || item.petName === pet.name)
  return registry?.status !== 'Inactiva' && registry?.status !== 'Retirada'
}

export function getSuccessStories(storage) {
  return readCollection(storage, SUCCESS_STORIES_STORAGE_KEY)
}

export function validateSuccessStory(values, storage) {
  const errors = {}
  const petId = clean(values.petId)
  if (!petId) errors.petId = 'Selecciona una mascota.'
  else if (!isActivePet(petId, storage)) errors.petId = 'Solo se pueden publicar historias de mascotas activas.'
  if (!clean(values.title)) errors.title = 'Escribe un título para la historia.'
  if (!clean(values.description)) errors.description = 'Escribe la descripción de la historia.'
  return errors
}

export function createSuccessStory(values, {
  id = globalThis.crypto.randomUUID(),
  createdAt = new Date().toISOString(),
} = {}) {
  const pet = pets.find((item) => item.id === clean(values.petId))
  return {
    id,
    petId: pet.id,
    petName: pet.name,
    title: clean(values.title),
    description: clean(values.description),
    createdAt,
  }
}

export function saveSuccessStory(storage, story) {
  if (!isActivePet(story.petId, storage)) throw new Error('Solo se pueden publicar historias de mascotas activas.')
  const stories = getSuccessStories(storage)
  if (stories.some((item) => item.id === story.id)) throw new Error('La historia ya está publicada.')
  stories.push(story)
  storage.setItem(SUCCESS_STORIES_STORAGE_KEY, JSON.stringify(stories))
}

export function updateSuccessStory(storage, storyId, values) {
  const stories = getSuccessStories(storage)
  const story = stories.find((item) => item.id === storyId)
  if (!story) throw new Error('No encontramos la historia que quieres editar.')
  if (!isActivePet(story.petId, storage)) throw new Error('Solo se pueden editar historias de mascotas activas.')
  story.title = clean(values.title)
  story.description = clean(values.description)
  storage.setItem(SUCCESS_STORIES_STORAGE_KEY, JSON.stringify(stories))
  return story
}

export function deleteSuccessStory(storage, storyId) {
  const stories = getSuccessStories(storage)
  const index = stories.findIndex((item) => item.id === storyId)
  if (index < 0) throw new Error('No encontramos la historia que quieres eliminar.')
  stories.splice(index, 1)
  storage.setItem(SUCCESS_STORIES_STORAGE_KEY, JSON.stringify(stories))
}