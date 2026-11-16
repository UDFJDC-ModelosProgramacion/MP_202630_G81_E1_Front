import { pets } from '../gallery.js'
import { readCollection } from './storage.js'

export const PHOTOS_STORAGE_KEY = 'huellitas.photos'

const petById = (petId) => pets.find((pet) => pet.id === petId)
const clean = (value) => typeof value === 'string' ? value.trim() : ''

function initialPhotos() {
  return pets.flatMap((pet) => pet.photos.map((photo, index) => ({
    id: `${pet.id}-photo-${index + 1}`,
    petId: pet.id,
    petName: pet.name,
    url: photo.src,
    description: photo.alt,
    principal: photo.principal,
  })))
}

export function getPhotos(storage, petId) {
  if (petId && !petById(petId)) throw new Error('La mascota seleccionada no existe.')
  const saved = storage.getItem(PHOTOS_STORAGE_KEY)
  const photos = saved === null ? initialPhotos() : readCollection(storage, PHOTOS_STORAGE_KEY)
  return petId ? photos.filter((photo) => photo.petId === petId) : photos
}

export function validatePhoto(values) {
  const errors = {}
  const petId = clean(values.petId)
  const url = clean(values.url)

  if (!petId) errors.petId = 'Selecciona una mascota.'
  else if (!petById(petId)) errors.petId = 'La mascota seleccionada no existe.'
  if (!/^https?:\/\/\S+$/i.test(url)) errors.url = 'Ingresa una URL válida para la fotografía.'
  return errors
}

export function createPhoto(values, {
  id = globalThis.crypto.randomUUID(),
  principal = false,
} = {}) {
  const pet = petById(clean(values.petId))
  return {
    id,
    petId: pet.id,
    petName: pet.name,
    url: clean(values.url),
    description: clean(values.description),
    principal: Boolean(principal || values.principal),
  }
}

function writePhotos(storage, photos) {
  storage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos))
}

export function savePhoto(storage, photo) {
  if (!petById(photo.petId)) throw new Error('La mascota asociada no existe.')
  const photos = getPhotos(storage)
  const duplicate = photos.some((item) => item.id === photo.id)
  if (duplicate) throw new Error('La fotografía ya está registrada.')
  if (photo.principal) {
    for (const item of photos) if (item.petId === photo.petId) item.principal = false
  } else if (!photos.some((item) => item.petId === photo.petId && item.principal)) {
    photo.principal = true
  }
  photos.push(photo)
  writePhotos(storage, photos)
}

export function updatePhoto(storage, photoId, values) {
  const photos = getPhotos(storage)
  const photo = photos.find((item) => item.id === photoId)
  if (!photo) throw new Error('No encontramos la fotografía que quieres editar.')
  if (!petById(photo.petId)) throw new Error('La mascota asociada no existe.')
  if (!/^https?:\/\/\S+$/i.test(clean(values.url))) throw new Error('Ingresa una URL válida para la fotografía.')

  photo.url = clean(values.url)
  photo.description = clean(values.description)
  if (values.principal) {
    for (const item of photos) if (item.petId === photo.petId) item.principal = item.id === photoId
  }
  writePhotos(storage, photos)
  return photo
}

export function setPrincipalPhoto(storage, petId, photoId) {
  if (!petById(petId)) throw new Error('La mascota asociada no existe.')
  const photos = getPhotos(storage)
  const target = photos.find((photo) => photo.id === photoId && photo.petId === petId)
  if (!target) throw new Error('No encontramos la fotografía de esta mascota.')
  for (const photo of photos) if (photo.petId === petId) photo.principal = photo.id === photoId
  writePhotos(storage, photos)
}

export function deletePhoto(storage, petId, photoId) {
  if (!petById(petId)) throw new Error('La mascota asociada no existe.')
  const photos = getPhotos(storage)
  const index = photos.findIndex((photo) => photo.id === photoId && photo.petId === petId)
  if (index < 0) throw new Error('No encontramos la fotografía de esta mascota.')
  const [deleted] = photos.splice(index, 1)
  if (deleted.principal) {
    const replacement = photos.find((photo) => photo.petId === petId)
    if (replacement) replacement.principal = true
  }
  writePhotos(storage, photos)
}