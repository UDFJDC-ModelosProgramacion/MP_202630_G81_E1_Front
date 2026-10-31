import { describe, expect, it, vi } from 'vitest'
import { loadProfile, saveProfile, validateProfile } from '../src/workflows/HU10.js'

const values = { nombre: ' Camila ', email: 'c@x.co', telefono: '3001234567', ciudad: 'Bogotá', direccion: 'Cra 1' }
const reply = (body, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body })

describe('HU10 adoptante profile', () => {
  it('validates the profile like the registration', () => {
    expect(validateProfile(values)).toEqual({})
    expect(validateProfile({ ...values, email: 'mal' })).toEqual({ email: 'invalid' })
  })

  it('loads the profile of an adoptante', async () => {
    const fetchFn = reply({ id: 4, nombre: 'Camila' })
    expect(await loadProfile('4', { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true, adoptante: { id: 4, nombre: 'Camila' } })
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/adoptantes/4', { method: 'GET' })
  })

  it('reports a profile that cannot be loaded', async () => {
    const fetchFn = reply({ apierror: { message: 'El adoptante con el id dado no fue encontrado' } }, false)
    expect(await loadProfile('9', { fetchFn })).toEqual({ ok: false, message: 'El adoptante con el id dado no fue encontrado' })
  })

  it('saves the profile with a trimmed payload', async () => {
    const fetchFn = reply({ id: 4, nombre: 'Camila' })
    expect(await saveProfile('4', values, { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true, adoptante: { id: 4, nombre: 'Camila' } })
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe('http://api.test/adoptantes/4')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual({ id: 4, nombre: 'Camila', email: 'c@x.co', telefono: '3001234567', ciudad: 'Bogotá', direccion: 'Cra 1' })
  })

  it('reports a rejected update', async () => {
    const fetchFn = reply({ apierror: { message: 'Ya existe un adoptante registrado con ese correo electrónico' } }, false)
    expect((await saveProfile('4', values, { fetchFn })).ok).toBe(false)
  })
})
