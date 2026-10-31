import { describe, expect, it, vi } from 'vitest'
import { getVacuna, listVacunas } from '../src/workflows/HU12.js'

const reply = (body, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body })

describe('HU12 vaccine catalog', () => {
  it('lists vaccines sorted by name', async () => {
    const fetchFn = reply([{ id: 2, nombre: 'Rabia' }, { id: 1, nombre: 'Moquillo' }])
    const result = await listVacunas({ fetchFn, apiUrl: 'http://api.test' })
    expect(result.vacunas.map((item) => item.nombre)).toEqual(['Moquillo', 'Rabia'])
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/vacunas', { method: 'GET' })
  })

  it('returns an empty catalog', async () => {
    expect(await listVacunas({ fetchFn: reply([]) })).toEqual({ ok: true, vacunas: [] })
  })

  it('reports catalog errors', async () => {
    expect((await listVacunas({ fetchFn: reply({}, false) })).ok).toBe(false)
  })

  it('gets the detail of one vaccine', async () => {
    const fetchFn = reply({ id: 2, nombre: 'Rabia' })
    expect(await getVacuna(2, { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true, vacuna: { id: 2, nombre: 'Rabia' } })
    expect(fetchFn.mock.calls[0][0]).toBe('http://api.test/vacunas/2')
  })
})
