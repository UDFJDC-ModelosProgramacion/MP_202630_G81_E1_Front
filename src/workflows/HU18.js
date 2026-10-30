export const APPLICATION_STORAGE_KEY = 'huellitas.adoptionApplications'

const supportedValues = {
  housing: ['Casa', 'Apartamento', 'Otro'],
  household: ['Vivo solo/a', 'Con mi pareja', 'Con mi familia', 'Con compañeros/as'],
  experience: [
    'Sí, actualmente tengo mascotas',
    'Sí, tuve mascotas antes',
    'No, sería mi primera vez',
  ],
}

export function validateApplication(application) {
  const errors = {}
  const value = (field) => typeof application[field] === 'string' ? application[field].trim() : ''

  if (value('fullName').length < 2) errors.fullName = 'required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'))) errors.email = 'invalid'
  const phoneDigits = value('phone').replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15) errors.phone = 'invalid'
  if (!value('city')) errors.city = 'required'
  if (!value('address')) errors.address = 'required'
  if (!supportedValues.housing.includes(value('housing'))) errors.housing = 'invalid'
  if (!supportedValues.household.includes(value('household'))) errors.household = 'invalid'
  if (!supportedValues.experience.includes(value('experience'))) errors.experience = 'invalid'
  if (!value('reason')) errors.reason = 'required'
  if (application.consent !== true) errors.consent = 'required'

  return errors
}

export function createApplication(values, {
  id = globalThis.crypto.randomUUID(),
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    createdAt,
    petId: 'mora',
    petName: 'Mora',
    status: 'Pendiente',
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
    housing: values.housing,
    household: values.household,
    experience: values.experience,
    requestType: 'Adopción',
    reason: values.reason.trim(),
  }
}

export function getStoredApplications(storage) {
  const stored = storage.getItem(APPLICATION_STORAGE_KEY)
  if (stored === null) return []

  const applications = JSON.parse(stored)
  if (!Array.isArray(applications)) {
    throw new TypeError('Las solicitudes guardadas deben estar en una lista.')
  }

  return applications
}

export function saveApplication(application, storage) {
  const applications = getStoredApplications(storage)
  applications.push(application)
  storage.setItem(APPLICATION_STORAGE_KEY, JSON.stringify(applications))
}
