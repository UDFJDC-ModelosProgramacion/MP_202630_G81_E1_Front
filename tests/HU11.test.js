import { describe, expect, it, vi } from 'vitest'
import { getAdoptante, listAdoptantes } from '../src/workflows/HU11.js'

const reply = (body, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body })

describe('HU11 adoptantes list', () => {
  it('lists adoptantes sorted by name', async () => {
    const fetchFn = reply([{ id: 2, nombre: 'Laura' }, { id: 1, nombre: 'Ángela' }, { id: 3, nombre: 'Camila' }])
    const result = await listAdoptantes({ fetchFn, apiUrl: 'http://api.test' })
    expect(result.adoptantes.map((item) => item.nombre)).toEqual(['Ángela', 'Camila', 'Laura'])
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/adoptantes', { method: 'GET' })
  })

  it('returns an empty list when there are no adoptantes', async () => {
    expect(await listAdoptantes({ fetchFn: reply([]) })).toEqual({ ok: true, adoptantes: [] })
  })

  it('reports list errors', async () => {
    expect((await listAdoptantes({ fetchFn: vi.fn().mockRejectedValue(new Error('down')) })).ok).toBe(false)
  })

  it('gets the detail of one adoptante', async () => {
    const fetchFn = reply({ id: 5, nombre: 'Laura' })
    expect(await getAdoptante(5, { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true, adoptante: { id: 5, nombre: 'Laura' } })
    expect(fetchFn.mock.calls[0][0]).toBe('http://api.test/adoptantes/5')
  })
})
