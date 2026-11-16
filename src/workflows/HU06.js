import { pets } from '../gallery.js'
import { isActivePet, SUCCESS_STORIES_STORAGE_KEY } from './HU05.js'
import { readCollection } from './storage.js'

export function getPublicSuccessStories(storage, petId) {
  const pet = pets.find((item) => item.id === petId)
  if (!pet) return { status: 'not-found', pet: null, stories: [] }
  if (!isActivePet(petId, storage)) return { status: 'inactive', pet, stories: [] }

  const stories = readCollection(storage, SUCCESS_STORIES_STORAGE_KEY)
    .filter((story) => story.petId === petId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))

  return { status: stories.length ? 'available' : 'empty', pet, stories }
}