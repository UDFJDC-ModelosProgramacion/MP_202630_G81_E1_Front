export const UPDATES_STORAGE_KEY = 'huellitas.actualizaciones'

export function getStoredUpdates(storage) {
  const stored = storage.getItem(UPDATES_STORAGE_KEY)

  if (stored === null) return []

  const updates = JSON.parse(stored)

  if (!Array.isArray(updates)) {
    throw new TypeError('Las actualizaciones guardadas deben ser una lista.')
  }

  return updates
}

export function filterUpdates(updates, filters = {}) {
  const type = filters.type ?? 'todos'
  const petId = typeof filters.petId === 'string' ? filters.petId.trim().toLowerCase() : ''
  const adopterId = typeof filters.adopterId === 'string' ? filters.adopterId.trim().toLowerCase() : ''

  return updates.filter((update) => {
    const matchesType = type === 'todos' || update.targetType === type

    const matchesPet = !petId || (
      update.targetType === 'mascota' &&
      update.targetId.toLowerCase().includes(petId)
    )

    const matchesAdopter = !adopterId || (
      update.targetType === 'adoptante' &&
      update.targetId.toLowerCase().includes(adopterId)
    )

    return matchesType && matchesPet && matchesAdopter
  })
}

export function findUpdateById(updates, id) {
  const searchId = typeof id === 'string' ? id.trim() : ''

  if (!searchId) return null

  return updates.find((update) => update.id === searchId) ?? null
}