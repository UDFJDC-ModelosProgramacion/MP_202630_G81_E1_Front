export const STORAGE_KEY = 'huellitas.actualizaciones'
export function validateUpdate(values) {
  const errors = {}

  const value = (field) =>
    typeof values[field] === 'string' ? values[field].trim() : ''

  if (!['mascota', 'adoptante'].includes(value('targetType'))) {
    errors.targetType = 'Selecciona una mascota o un adoptante.'
  }

  if (!value('targetId')) {
    errors.targetId = 'Escribe el identificador correspondiente.'
  }

  if (!value('title')) {
    errors.title = 'Escribe el título de la actualización.'
  }

  if (!value('description')) {
    errors.description = 'Escribe la descripción de la actualización.'
  }

  return errors
}

export function createUpdate(
  values,
  {
    id = globalThis.crypto.randomUUID(),
    createdAt = new Date().toISOString(),
  } = {},
) {
  return {
    id,
    createdAt,
    targetType: values.targetType.trim(),
    targetId: values.targetId.trim(),
    title: values.title.trim(),
    description: values.description.trim(),
  }
}

export function getStoredUpdates(storage) {
  const stored = storage.getItem(STORAGE_KEY)

  if (stored === null) return []

  const updates = JSON.parse(stored)

  if (!Array.isArray(updates)) {
    throw new TypeError(
      'Las actualizaciones guardadas deben ser una lista.',
    )
  }

  return updates
}

export function saveUpdate(update, storage) {
  const updates = getStoredUpdates(storage)

  updates.push(update)

  storage.setItem(STORAGE_KEY, JSON.stringify(updates))
}