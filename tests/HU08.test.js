import { describe, expect, it } from 'vitest'
import { createMessage, MESSAGES_STORAGE_KEY } from '../src/workflows/HU07.js'
import { setMessageReadStatus, setMessagesReadStatus } from '../src/workflows/HU08.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

describe('HU08 message read status', () => {
  it('marks owned messages read or unread', () => {
    const messages = [createMessage({ petId: 'mora', subject: 'Uno', content: 'A' }, { id: 'one' })]
    const storage = memoryStorage({ [MESSAGES_STORAGE_KEY]: JSON.stringify(messages) })
    expect(setMessageReadStatus(storage, 'one', 'samuel', true).read).toBe(true)
    expect(setMessageReadStatus(storage, 'one', 'samuel', false).read).toBe(false)
  })

  it('rejects messages from another adopter without partially changing a bulk selection', () => {
    const messages = [
      createMessage({ petId: 'mora', subject: 'Uno', content: 'A' }, { id: 'one' }),
      { ...createMessage({ petId: 'luna', subject: 'Dos', content: 'B' }, { id: 'two' }), adopterId: 'another' },
    ]
    const storage = memoryStorage({ [MESSAGES_STORAGE_KEY]: JSON.stringify(messages) })
    expect(() => setMessageReadStatus(storage, 'two', 'samuel', true)).toThrow('Solo puedes organizar mensajes de tu bandeja.')
    expect(() => setMessagesReadStatus(storage, ['one', 'two'], 'samuel', true)).toThrow('Solo puedes organizar mensajes de tu bandeja.')
    expect(JSON.parse(storage.getItem(MESSAGES_STORAGE_KEY))[0].read).toBe(false)
  })
})