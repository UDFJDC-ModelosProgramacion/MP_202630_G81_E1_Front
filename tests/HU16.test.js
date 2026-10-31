import { describe, expect, it, vi } from 'vitest'
import { deleteVaccination, toEditValues, updateVaccination } from '../src/workflows/HU16.js'

const reply = (body, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body })
const registro = {
  id: 8,
  fechaAplicacion: '2026-10-01T05:00:00.000+00:00',
  proximaFecha: '2027-10-01T05:00:00.000+00:00',
  numeroLote: 'L-45',
  observacion: 'Sin reacciones',
  vacuna: { id: 2 },
  mascota: { id: 3 },
}

describe('HU16 vaccination record editing', () => {
  it('turns a record into form values', () => {
    expect(toEditValues(registro)).toEqual({
      mascotaId: '3', vacunaId: '2', fechaAplicacion: '2026-10-01', proximaFecha: '2027-10-01',
      numeroLote: 'L-45', observacion: 'Sin reacciones',
    })
  })

  it('fills missing optional values with empty text', () => {
    expect(toEditValues({ ...registro, proximaFecha: null, numeroLote: null, observacion: null }))
      .toMatchObject({ proximaFecha: '', numeroLote: '', observacion: '' })
  })

  it('updates a record', async () => {
    const fetchFn = reply({ id: 8 })
    const values = { ...toEditValues(registro), numeroLote: 'L-99' }
    expect(await updateVaccination('8', values, { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true, registro: { id: 8 } })
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe('http://api.test/registros-vacunacion/8')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toMatchObject({ id: 8, numeroLote: 'L-99', vacuna: { id: 2 }, mascota: { id: 3 } })
  })

  it('deletes a record', async () => {
    const fetchFn = reply({})
    expect(await deleteVaccination(8, { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true })
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/registros-vacunacion/8', { method: 'DELETE' })
  })

  it('reports rejected operations', async () => {
    const body = { apierror: { message: 'El registro no existe' } }
    expect(await updateVaccination('8', toEditValues(registro), { fetchFn: reply(body, false) })).toEqual({ ok: false, message: 'El registro no existe' })
    expect(await deleteVaccination(8, { fetchFn: reply(body, false) })).toEqual({ ok: false, message: 'El registro no existe' })
  })
})
