import { readCollection, isValidDate, PET_AVAILABILITY_STORAGE_KEY, PET_HISTORY_STORAGE_KEY } from './storage.js'

export const RETURNS_STORAGE_KEY = 'huellitas.returns'

const returnReasons = [
  'Incompatibilidad con el adoptante',
  'Situación de salud de la mascota',
  'Cambio en las circunstancias del adoptante',
  'Otro motivo',
]

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateReturn(values) {
  const errors = {}

  if (!text(values.petName)) errors.petName = 'Ingresa el nombre de la mascota.'
  if (!text(values.adopterName)) errors.adopterName = 'Ingresa el nombre del adoptante.'
  if (!isValidDate(text(values.returnDate))) errors.returnDate = 'Selecciona una fecha de devolución válida.'
  if (!returnReasons.includes(text(values.reason))) errors.reason = 'Selecciona el motivo de la devolución.'
  if (!text(values.description)) errors.description = 'Describe la situación de la devolución.'
  if (!['si', 'no'].includes(values.compatibleReAdoption)) {
    errors.compatibleReAdoption = 'Indica si la mascota puede volver a estar disponible.'
  }

  return errors
}

export function createReturn(values, {
  id = globalThis.crypto.randomUUID(),
  createdAt = new Date().toISOString(),
} = {}) {
  const compatibleReAdoption = values.compatibleReAdoption === 'si'

  return {
    id,
    createdAt,
    petName: text(values.petName),
    adopterName: text(values.adopterName),
    returnDate: values.returnDate,
    reason: text(values.reason),
    description: text(values.description),
    compatibleReAdoption,
    availability: compatibleReAdoption ? 'Disponible' : 'En evaluación',
    status: 'Registrada',
  }
}

export function saveReturn(storage, returnRecord) {
  const returns = readCollection(storage, RETURNS_STORAGE_KEY)
  const history = readCollection(storage, PET_HISTORY_STORAGE_KEY)
  const availability = readCollection(storage, PET_AVAILABILITY_STORAGE_KEY)
  const existingPet = availability.find((pet) => pet.petName === returnRecord.petName)

  if (existingPet) {
    existingPet.status = returnRecord.availability
  } else {
    availability.push({
      petName: returnRecord.petName,
      status: returnRecord.availability,
    })
  }

  returns.push(returnRecord)
  history.push({
    type: 'Retorno',
    returnId: returnRecord.id,
    petName: returnRecord.petName,
    date: returnRecord.returnDate,
    reason: returnRecord.reason,
    description: returnRecord.description,
  })

  storage.setItem(RETURNS_STORAGE_KEY, JSON.stringify(returns))
  storage.setItem(PET_HISTORY_STORAGE_KEY, JSON.stringify(history))
  storage.setItem(PET_AVAILABILITY_STORAGE_KEY, JSON.stringify(availability))
}
