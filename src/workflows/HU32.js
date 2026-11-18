// HU32 - Registrar una mascota: lógica pura (sin DOM).
import { DEFAULT_API_URL, PET_NOT_FOUND, PET_STATES, normalizePet } from '../catalog/catalog.js'
import {
  ApiError, isId, isObject, orNull, requestJson, requiredErrors, trimValues, validateId,
} from '../api-client.js'

export const REFUGIO_NOT_FOUND = 'El refugio indicado no existe.'
export const PET_STATE_ERROR = 'El estado debe ser Disponible, En proceso de adopcion o Adoptado.'
export const PET_ID_ERROR = 'Ingresa el número de la mascota.'

// Las claves son los nombres de los campos que envía el API (MascotaDTO).
export const PET_FIELDS = [
  { name: 'nombre', label: 'Nombre', required: 'El nombre es obligatorio.' },
  { name: 'especie', label: 'Especie', required: 'La especie es obligatoria.' },
  { name: 'raza', label: 'Raza' },
  { name: 'edad', label: 'Edad (años)', type: 'number' },
  { name: 'sexo', label: 'Sexo', type: 'select', options: ['Macho', 'Hembra'] },
  { name: 'tamano', label: 'Tamaño', type: 'select', options: ['Pequeño', 'Mediano', 'Grande'] },
  { name: 'temperamento', label: 'Temperamento' },
  { name: 'estado', label: 'Estado', type: 'select', options: PET_STATES, required: 'Selecciona el estado de la mascota.' },
  { name: 'refugioId', label: 'Número de refugio (opcional)', type: 'number' },
]

export function validatePet(values) {
  const clean = trimValues(values, PET_FIELDS)
  const errors = requiredErrors(clean, PET_FIELDS)

  if (clean.edad !== '') {
    const age = Number(clean.edad)
    if (!Number.isInteger(age)) errors.edad = 'La edad debe ser un número entero.'
    else if (age < 0) errors.edad = 'La edad no puede ser negativa.'
  }
  if (clean.estado && !PET_STATES.includes(clean.estado)) errors.estado = PET_STATE_ERROR
  if (clean.refugioId && !isId(clean.refugioId)) errors.refugioId = 'El número de refugio debe ser un número positivo.'

  return errors
}

export function buildPetPayload(values) {
  const clean = trimValues(values, PET_FIELDS)
  const payload = {
    nombre: clean.nombre,
    especie: clean.especie,
    raza: orNull(clean.raza),
    edad: clean.edad === '' ? null : Number(clean.edad),
    sexo: orNull(clean.sexo),
    tamano: orNull(clean.tamano),
    temperamento: orNull(clean.temperamento),
    estado: clean.estado,
  }
  if (clean.refugioId) payload.refugio = { id: Number(clean.refugioId) }
  return payload
}

export async function registerPet(fetchFn, values, apiUrl = DEFAULT_API_URL) {
  const body = await requestJson(fetchFn, `${apiUrl}/mascotas`, {
    method: 'POST',
    body: buildPetPayload(values),
    notFound: REFUGIO_NOT_FOUND,
    failure: 'El servidor no pudo registrar la mascota en este momento.',
  })
  return isObject(body) ? normalizePet(body) : null
}

export async function deletePet(fetchFn, id, apiUrl = DEFAULT_API_URL) {
  const error = validateId(id, PET_ID_ERROR)
  if (error) throw new ApiError(error)

  await requestJson(fetchFn, `${apiUrl}/mascotas/${encodeURIComponent(String(id).trim())}`, {
    method: 'DELETE',
    notFound: PET_NOT_FOUND,
    failure: 'El servidor no pudo eliminar la mascota en este momento.',
  })
  return true
}
