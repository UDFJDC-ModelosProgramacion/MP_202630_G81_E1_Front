import { describe, expect, it } from 'vitest'
import {
  createMessage,
  CURRENT_ADOPTER_ID,
  deleteMessage,
  editMessage,
  getAdopterMessages,
  MESSAGES_STORAGE_KEY,
  saveMessage,
  validateMessage,
} from '../src/workflows/HU07.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

const values = { petId: 'mora', subject: 'Visita', content: '¿Cuál es el horario?' }

describe('HU07 adopter messages', () => {
  it('validates required fields and creates normalized unread messages', () => {
    expect(validateMessage({})).toEqual({ petId: 'Selecciona una mascota.', subject: 'Escribe el asunto del mensaje.', content: 'Escribe el contenido del mensaje.' })
    expect(validateMessage(values)).toEqual({})
    expect(createMessage({ ...values, subject: ' Visita ' }, { id: 'm1', createdAt: 'stamp' })).toMatchObject({
      id: 'm1', adopterId: CURRENT_ADOPTER_ID, petName: 'Mora', subject: 'Visita', read: false, createdAt: 'stamp',
    })
    expect(() => createMessage({ ...values, petId: 'missing' }, { id: 'bad' })).toThrow('Selecciona una mascota válida.')
  })

  it('stores, filters, sorts, edits and deletes only the adopter messages', () => {
    const storage = memoryStorage()
    const message = createMessage(values, { id: 'm1', createdAt: '2026-01-01' })
    saveMessage(storage, message)
    expect(() => saveMessage(storage, message)).toThrow('El mensaje ya está registrado.')
    saveMessage(storage, createMessage({ ...values, subject: 'Actualización' }, { id: 'm2', createdAt: '2026-02-01' }))
    saveMessage(storage, { ...message, id: 'other-user', adopterId: 'another', createdAt: '2026-02-01' })
    expect(getAdopterMessages(storage).map((item) => item.id)).toEqual(['m2', 'm1'])
    expect(getAdopterMessages(storage, CURRENT_ADOPTER_ID, 'luna')).toEqual([])
    expect(editMessage(storage, 'm1', CURRENT_ADOPTER_ID, { ...values, subject: 'Nueva visita' }).subject).toBe('Nueva visita')
    expect(() => editMessage(storage, 'm1', CURRENT_ADOPTER_ID, { ...values, content: '  ' })).toThrow('Escribe el contenido del mensaje.')
    expect(() => editMessage(storage, 'other-user', CURRENT_ADOPTER_ID, values)).toThrow('El mensaje no pertenece al adoptante.')
    deleteMessage(storage, 'm1')
    deleteMessage(storage, 'm2')
    expect(getAdopterMessages(storage)).toEqual([])
    expect(() => deleteMessage(storage, 'other-user')).toThrow('El mensaje no pertenece al adoptante.')
    expect(MESSAGES_STORAGE_KEY).toBe('huellitas.messages')
  })

  it('prevents editing or deleting a message after it is read', () => {
    const readMessage = { ...createMessage(values, { id: 'read' }), read: true }
    const storage = memoryStorage({ [MESSAGES_STORAGE_KEY]: JSON.stringify([readMessage]) })
    expect(() => editMessage(storage, 'read', CURRENT_ADOPTER_ID, values)).toThrow('El mensaje ya fue leído y no puede editarse.')
    expect(() => deleteMessage(storage, 'read')).toThrow('El mensaje ya fue leído y no puede eliminarse.')
  })
})