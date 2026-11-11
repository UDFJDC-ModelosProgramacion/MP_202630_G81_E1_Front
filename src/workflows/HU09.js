import { apiRequest, withData } from '../api/client.js'

export const ADOPTANTE_STORAGE_KEY = 'huellitas.adoptanteId'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const ADOPTANTE_ERROR_MESSAGES = {
  nombre: 'Escribe tu nombre completo.',
  email: 'Ingresa un correo electrónico válido.',
  telefono: 'Ingresa un teléfono válido (mínimo 7 dígitos).',
  ciudad: 'Indica la ciudad donde vives.',
  direccion: 'Indica tu dirección.',
}

export function validateAdoptante(values) {
  const errors = {}
  const value = (field) => typeof values[field] === 'string' ? values[field].trim() : ''

  if (value('nombre').length < 2) errors.nombre = 'required'
  if (!EMAIL_PATTERN.test(value('email'))) errors.email = 'invalid'
  const phoneDigits = value('telefono').replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15) errors.telefono = 'invalid'
  if (!value('ciudad')) errors.ciudad = 'required'
  if (!value('direccion')) errors.direccion = 'required'

  return errors
}

export function buildAdoptantePayload(values) {
  return {
    nombre: values.nombre.trim(),
    email: values.email.trim(),
    telefono: values.telefono.trim(),
    ciudad: values.ciudad.trim(),
    direccion: values.direccion.trim(),
  }
}

export async function registerAdoptante(payload, options) {
  return withData(await apiRequest('/adoptantes', { ...options, method: 'POST', body: payload }), 'adoptante')
}

export function storeAdoptanteId(id, storage) {
  if (id === undefined || id === null) return
  storage.setItem(ADOPTANTE_STORAGE_KEY, String(id))
}

export function getStoredAdoptanteId(storage) {
  return storage.getItem(ADOPTANTE_STORAGE_KEY)
}
