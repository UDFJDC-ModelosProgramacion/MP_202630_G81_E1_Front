import { MESSAGES_STORAGE_KEY } from './HU07.js'
import { readCollection } from './storage.js'

export function setMessageReadStatus(storage, messageId, adopterId, read) {
  return setMessagesReadStatus(storage, [messageId], adopterId, read)[0]
}

export function setMessagesReadStatus(storage, messageIds, adopterId, read) {
  const messages = readCollection(storage, MESSAGES_STORAGE_KEY)
  const selected = messageIds.map((messageId) => messages.find((message) => message.id === messageId))
  if (selected.some((message) => !message || message.adopterId !== adopterId)) {
    throw new Error('Solo puedes organizar mensajes de tu bandeja.')
  }
  for (const message of selected) message.read = read
  storage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  return selected
}