import { describe, expect, it, vi } from 'vitest'
import { getVaccinationHistory } from '../src/workflows/HU15.js'

const reply = (body, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body })
const registros = [
  { id: 1, fechaAplicacion: '2026-01-10T05:00:00.000+00:00', mascota: { id: 3 }, vacuna: { nombre: 'Rabia' } },
  { id: 2, fechaAplicacion: '2026-08-10T05:00:00.000+00:00', mascota: { id: 3 }, vacuna: { nombre: 'Moquillo' } },
  { id: 3, fechaAplicacion: '2026-05-10T05:00:00.000+00:00', mascota: { id: 4 }, vacuna: { nombre: 'Rabia' } },
  { id: 4, fechaAplicacion: null, mascota: { id: 3 }, vacuna: { nombre: 'Parvovirus' } },
  { id: 6, fechaAplicacion: '2026-03-01T05:00:00.000+00:00', mascota: { id: 3 }, vacuna: { nombre: 'Triple' } },
  { id: 7, fechaAplicacion: null, mascota: { id: 3 }, vacuna: { nombre: 'Tos' } },
  { id: 5, fechaAplicacion: '2026-02-01T05:00:00.000+00:00', vacuna: { nombre: 'Rabia' } },
]

describe('HU15 vaccination history', () => {
  it('returns only the records of the pet, newest first', async () => {
    const fetchFn = reply(registros)
    const result = await getVaccinationHistory('3', { fetchFn, apiUrl: 'http://api.test' })
    expect(result.registros.map((item) => item.id)).toEqual([2, 6, 1, 4, 7])
    expect(fetchFn.mock.calls[0][0]).toBe('http://api.test/registros-vacunacion')
  })

  it('returns an empty history for a pet without records', async () => {
    expect(await getVaccinationHistory('99', { fetchFn: reply(registros) })).toEqual({ ok: true, registros: [] })
  })

  it('reports errors', async () => {
    expect((await getVaccinationHistory('3', { fetchFn: reply({}, false) })).ok).toBe(false)
  })
})
