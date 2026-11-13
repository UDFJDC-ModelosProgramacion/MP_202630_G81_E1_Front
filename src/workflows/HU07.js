import { pets } from '../gallery.js'
import { readCollection } from './storage.js'

export const MESSAGES_STORAGE_KEY = 'huellitas.messages'
export const CURRENT_ADOPTER_ID = 'samuel'

const clean = (value) => typeof value === 'string' ? value.trim() : ''

export function getAdopterMessages(storage, adopterId = CURRENT_ADOPTER_ID, petId = '') {
  return readCollection(storage, MESSAGES_STORAGE_KEY)
    .filter((message) => message.adopterId === adopterId && (!petId || message.petId === petId))
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
}

export function validateMessage(values) {
  const errors = {}
  if (!pets.some((pet) => pet.id === clean(values.petId))) errors.petId = 'Selecciona una mascota.'
  if (!clean(values.subject)) errors.subject = 'Escribe el asunto del mensaje.'
  if (!clean(values.content)) errors.content = 'Escribe el contenido del mensaje.'
  return errors
}

export function createMessage(values, {
  id = globalThis.crypto.randomUUID(),
  adopterId = CURRENT_ADOPTER_ID,
  createdAt = new Date().toISOString(),
} = {}) {
  const pet = pets.find((item) => item.id === clean(values.petId))
  if (!pet) throw new Error('Selecciona una mascota válida.')
  return {
    id,
    adopterId,
    petId: pet.id,
    petName: pet.name,
    subject: clean(values.subject),
    content: clean(values.content),
    createdAt,
    read: false,
  }
}

export function saveMessage(storage, message) {
  const messages = readCollection(storage, MESSAGES_STORAGE_KEY)
  if (messages.some((item) => item.id === message.id)) throw new Error('El mensaje ya está registrado.')
  messages.push(message)
  storage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  return message
}

export function editMessage(storage, messageId, adopterId, values) {
  const messages = readCollection(storage, MESSAGES_STORAGE_KEY)
  const message = messages.find((item) => item.id === messageId)
  if (!message || message.adopterId !== adopterId) throw new Error('El mensaje no pertenece al adoptante.')
  if (message.read) throw new Error('El mensaje ya fue leído y no puede editarse.')
  const errors = validateMessage(values)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const pet = pets.find((item) => item.id === clean(values.petId))
  message.petId = pet.id
  message.petName = pet.name
  message.subject = clean(values.subject)
  message.content = clean(values.content)
  storage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  return message
}

export function deleteMessage(storage, messageId, adopterId = CURRENT_ADOPTER_ID) {
  const messages = readCollection(storage, MESSAGES_STORAGE_KEY)
  const index = messages.findIndex((item) => item.id === messageId)
  if (index < 0 || messages[index].adopterId !== adopterId) throw new Error('El mensaje no pertenece al adoptante.')
  if (messages[index].read) throw new Error('El mensaje ya fue leído y no puede eliminarse.')
  messages.splice(index, 1)
  storage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
}