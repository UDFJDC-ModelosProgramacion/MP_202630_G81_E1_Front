import {
  appendCollection,
  isValidDate,
  PET_AVAILABILITY_STORAGE_KEY,
  PET_HISTORY_STORAGE_KEY,
  readCollection,
} from './storage.js'

export const FORMALIZATIONS_STORAGE_KEY = 'huellitas.formalizations'

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateFormalization(values) {
  const errors = {}
  const adoptionDate = text(values.adoptionDate)
  const nextAppointment = text(values.nextAppointment)

  if (!text(values.adopterName)) errors.adopterName = 'Ingresa el nombre del adoptante.'
  if (!text(values.petName)) errors.petName = 'Ingresa el nombre de la mascota.'
  if (!isValidDate(adoptionDate)) errors.adoptionDate = 'Selecciona una fecha de adopción válida.'
  if (!text(values.veterinarian)) errors.veterinarian = 'Asigna un veterinario responsable.'
  if (!isValidDate(nextAppointment)) {
    errors.nextAppointment = 'Selecciona una fecha válida para el seguimiento.'
  } else if (isValidDate(adoptionDate) && nextAppointment < adoptionDate) {
    errors.nextAppointment = 'La cita de seguimiento no puede ser anterior a la adopción.'
  }

  return errors
}

export function createFormalization(values, {
  id = globalThis.crypto.randomUUID(),
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    createdAt,
    adopterName: text(values.adopterName),
    petName: text(values.petName),
    adoptionDate: values.adoptionDate,
    veterinarian: text(values.veterinarian),
    nextAppointment: values.nextAppointment,
    observation: text(values.observation),
    status: 'Formalizada',
    followUpStatus: 'Programado',
  }
}

export function saveFormalization(storage, formalization) {
  appendCollection(storage, FORMALIZATIONS_STORAGE_KEY, formalization)
  appendCollection(storage, PET_HISTORY_STORAGE_KEY, {
    type: 'Adopción',
    adoptionId: formalization.id,
    petName: formalization.petName,
    adopterName: formalization.adopterName,
    date: formalization.adoptionDate,
    veterinarian: formalization.veterinarian,
  })

  const availability = readCollection(storage, PET_AVAILABILITY_STORAGE_KEY)
  const existingPet = availability.find((pet) => pet.petName === formalization.petName)
  if (existingPet) {
    existingPet.status = 'Adoptada'
  } else {
    availability.push({ petName: formalization.petName, status: 'Adoptada' })
  }
  storage.setItem(PET_AVAILABILITY_STORAGE_KEY, JSON.stringify(availability))
}
