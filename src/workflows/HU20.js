import { addDays, appendCollection, isValidDate } from './storage.js'

export const TRIALS_STORAGE_KEY = 'huellitas.trials'

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateTrial(values) {
  const errors = {}
  const duration = Number(values.durationDays)

  if (!text(values.adopterName)) errors.adopterName = 'Ingresa el nombre del adoptante.'
  if (!text(values.petName)) errors.petName = 'Ingresa el nombre de la mascota.'
  if (!isValidDate(text(values.startDate))) errors.startDate = 'Selecciona una fecha de inicio válida.'
  if (!Number.isInteger(duration) || duration <= 0) {
    errors.durationDays = 'La duración debe ser un número entero mayor que cero.'
  }

  return errors
}

export function createTrial(values, {
  id = globalThis.crypto.randomUUID(),
  createdAt = new Date().toISOString(),
} = {}) {
  const durationDays = Number(values.durationDays)

  return {
    id,
    createdAt,
    adopterName: text(values.adopterName),
    petName: text(values.petName),
    startDate: values.startDate,
    endDate: addDays(values.startDate, durationDays),
    durationDays,
    observation: text(values.observation),
    status: 'Programada',
  }
}

export function saveTrial(storage, trial) {
  appendCollection(storage, TRIALS_STORAGE_KEY, trial)
}
