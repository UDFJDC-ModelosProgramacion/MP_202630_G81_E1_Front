import { describe, expect, it, vi } from 'vitest'
import { buildVacunaPayload, createVacuna, deleteVacuna, updateVacuna, validateVacuna } from '../src/workflows/HU13.js'

const reply = (body, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body })

describe('HU13 vaccine management', () => {
  it('requires a vaccine name', () => {
    expect(validateVacuna({ nombre: 'Rabia' })).toEqual({})
    expect(validateVacuna({ nombre: ' ' })).toEqual({ nombre: 'Ingresa el nombre de la vacuna.' })
    expect(validateVacuna({})).toEqual({ nombre: 'Ingresa el nombre de la vacuna.' })
  })

  it('builds a trimmed payload', () => {
    expect(buildVacunaPayload({ nombre: ' Rabia ', descripcion: ' Anual ' })).toEqual({ nombre: 'Rabia', descripcion: 'Anual' })
    expect(buildVacunaPayload({ nombre: 'Rabia' })).toEqual({ nombre: 'Rabia', descripcion: '' })
  })

  it('creates a vaccine', async () => {
    const fetchFn = reply({ id: 1, nombre: 'Rabia' })
    expect(await createVacuna({ nombre: 'Rabia' }, { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true, vacuna: { id: 1, nombre: 'Rabia' } })
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe('http://api.test/vacunas')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ nombre: 'Rabia', descripcion: '' })
  })

  it('updates a vaccine', async () => {
    const fetchFn = reply({ id: 1, nombre: 'Rabia anual' })
    const result = await updateVacuna('1', { nombre: 'Rabia anual', descripcion: 'x' }, { fetchFn, apiUrl: 'http://api.test' })
    expect(result.vacuna.nombre).toBe('Rabia anual')
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe('http://api.test/vacunas/1')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body).id).toBe(1)
  })

  it('deletes a vaccine', async () => {
    const fetchFn = reply({})
    expect(await deleteVacuna(1, { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true })
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/vacunas/1', { method: 'DELETE' })
  })

  it('reports a rejected operation', async () => {
    const body = { apierror: { message: 'Ya existe una vacuna con el nombre indicado' } }
    expect(await createVacuna({ nombre: 'Rabia' }, { fetchFn: reply(body, false) })).toEqual({ ok: false, message: 'Ya existe una vacuna con el nombre indicado' })
    expect((await deleteVacuna(1, { fetchFn: reply(body, false) })).ok).toBe(false)
  })
})
