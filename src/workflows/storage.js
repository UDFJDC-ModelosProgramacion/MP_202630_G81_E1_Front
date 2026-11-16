export const PET_HISTORY_STORAGE_KEY = 'huellitas.petHistory'
export const PET_AVAILABILITY_STORAGE_KEY = 'huellitas.petAvailability'

export function readCollection(storage, key) {
  const saved = storage.getItem(key)
  if (saved === null) return []

  const collection = JSON.parse(saved)
  if (!Array.isArray(collection)) {
    throw new TypeError(`El registro ${key} debe ser una lista.`)
  }

  return collection
}

export function appendCollection(storage, key, item) {
  const collection = readCollection(storage, key)
  collection.push(item)
  storage.setItem(key, JSON.stringify(collection))
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
