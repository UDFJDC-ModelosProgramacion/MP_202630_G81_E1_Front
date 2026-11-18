import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_API_URL, PET_NOT_FOUND } from '../src/catalog/catalog.js'
import {
  PET_FIELDS,
  PET_ID_ERROR,
  PET_STATE_ERROR,
  REFUGIO_NOT_FOUND,
  buildPetPayload,
  deletePet,
  registerPet,
  validatePet,
} from '../src/workflows/HU32.js'

const API = 'http://api.test/api'
const res = (body, { ok = true, status = 200 } = {}) => ({ ok, status, json: async () => body })
const brokenJson = ({ ok = true, status = 200 } = {}) => ({ ok, status, json: async () => { throw new SyntaxError('bad') } })
const values = {
  nombre: 'Mora', especie: 'Perro', raza: 'Criollo', edad: '3', sexo: 'Hembra', tamano: 'Mediano',
  temperamento: 'Juguetona', estado: 'Disponible', refugioId: '7',
}

describe('validatePet', () => {
  it('accepts a complete pet', () => {
    expect(validatePet(values)).toEqual({})
  })

  it('only requires name, species and state', () => {
    const errors = validatePet({})
    expect(Object.keys(errors)).toEqual(['nombre', 'especie', 'estado'])
    expect(errors.nombre).toBe('El nombre es obligatorio.')
    expect(errors.especie).toBe('La especie es obligatoria.')
  })

  it('rejects name and species made only of spaces', () => {
    const errors = validatePet({ ...values, nombre: '   ', especie: ' ' })
    expect(errors.nombre).toBe('El nombre es obligatorio.')
    expect(errors.especie).toBe('La especie es obligatoria.')
  })

  it('does not accept a negative age', () => {
    expect(validatePet({ ...values, edad: '-1' }).edad).toBe('La edad no puede ser negativa.')
  })

  it('accepts age zero and rejects ages that are not whole numbers', () => {
    expect(validatePet({ ...values, edad: '0' }).edad).toBeUndefined()
    expect(validatePet({ ...values, edad: '2.5' }).edad).toBe('La edad debe ser un número entero.')
    expect(validatePet({ ...values, edad: 'abc' }).edad).toBe('La edad debe ser un número entero.')
  })

  it('only accepts the three valid states', () => {
    expect(validatePet({ ...values, estado: 'Perdido' }).estado).toBe(PET_STATE_ERROR)
    for (const estado of ['Disponible', 'En proceso de adopcion', 'Adoptado']) {
      expect(validatePet({ ...values, estado }).estado).toBeUndefined()
    }
  })

  it('validates the optional shelter number', () => {
    expect(validatePet({ ...values, refugioId: 'x' }).refugioId).toContain('número positivo')
    expect(validatePet({ ...values, refugioId: '' }).refugioId).toBeUndefined()
  })

  it('describes every field of the form', () => {
    expect(PET_FIELDS.map((f) => f.name)).toContain('estado')
  })
})

describe('buildPetPayload', () => {
  it('builds the body the API expects', () => {
    expect(buildPetPayload(values)).toEqual({
      nombre: 'Mora', especie: 'Perro', raza: 'Criollo', edad: 3, sexo: 'Hembra', tamano: 'Mediano',
      temperamento: 'Juguetona', estado: 'Disponible', refugio: { id: 7 },
    })
  })

  it('sends null for optional data left empty and omits the shelter', () => {
    const payload = buildPetPayload({ nombre: ' Rex ', especie: 'Perro', estado: 'Adoptado' })
    expect(payload).toEqual({
      nombre: 'Rex', especie: 'Perro', raza: null, edad: null, sexo: null, tamano: null,
      temperamento: null, estado: 'Adoptado',
    })
  })
})

describe('registerPet', () => {
  it('registers the pet with POST and returns it', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({ id: 5, nombre: 'Mora', especie: 'Perro' }, { status: 201 }))
    const pet = await registerPet(fetchFn, values, API)
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe(`${API}/mascotas`)
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body).refugio).toEqual({ id: 7 })
    expect(pet.id).toBe(5)
  })

  it('accepts a successful reply without a body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 201 }))
    expect(await registerPet(fetchFn, values)).toBeNull()
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/mascotas`)
  })

  it('reports that the shelter does not exist', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 404 }))
    const error = await registerPet(fetchFn, values, API).catch((e) => e)
    expect(error.message).toBe(REFUGIO_NOT_FOUND)
  })

  it('shows the message of the server when it rejects the pet', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({ apierror: { message: 'Estado inválido' } }, { ok: false, status: 400 }))
    await expect(registerPet(fetchFn, values, API)).rejects.toThrow('Estado inválido')
  })
})

describe('deletePet', () => {
  it('asks for a valid pet number', async () => {
    const fetchFn = vi.fn()
    await expect(deletePet(fetchFn, 'abc', API)).rejects.toThrow(PET_ID_ERROR)
    expect(fetchFn.mock.calls).toHaveLength(0)
  })

  it('deletes the pet with DELETE', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 204 }))
    expect(await deletePet(fetchFn, ' 5 ', API)).toBe(true)
    expect(fetchFn).toHaveBeenCalledWith(`${API}/mascotas/5`, { method: 'DELETE', headers: { Accept: 'application/json' } })
  })

  it('uses the default API URL when none is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 204 }))
    await deletePet(fetchFn, 5)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/mascotas/5`)
  })

  it('reports that the pet was not found', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 404 }))
    await expect(deletePet(fetchFn, '99', API)).rejects.toThrow(PET_NOT_FOUND)
  })

  it('shows the error when the pet has veterinary follow-ups', async () => {
    const message = 'No se puede eliminar una mascota con seguimientos veterinarios'
    const fetchFn = vi.fn().mockResolvedValue(res({ apierror: { message } }, { ok: false, status: 409 }))
    const error = await deletePet(fetchFn, '5', API).catch((e) => e)
    expect(error.message).toBe(message)
    expect(error.status).toBe(409)
  })
})
