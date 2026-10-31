import { describe, expect, it, vi } from 'vitest'
import { buildVaccinationPayload, createVaccination, listMascotas, validateVaccination } from '../src/workflows/HU14.js'

const reply = (body, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body })
const values = { mascotaId: '3', vacunaId: '2', fechaAplicacion: '2026-10-01', proximaFecha: '2027-10-01', numeroLote: ' L-45 ', observacion: ' Sin reacciones ' }

describe('HU14 vaccination registration', () => {
  it('accepts a complete registration', () => {
    expect(validateVaccination(values, '2026-10-30')).toEqual({})
    expect(validateVaccination({ ...values, proximaFecha: '' }, '2026-10-30')).toEqual({})
  })

  it('checks the required fields', () => {
    expect(validateVaccination({}, '2026-10-30')).toEqual({
      mascotaId: 'Selecciona una mascota.',
      vacunaId: 'Selecciona una vacuna.',
      fechaAplicacion: 'Selecciona una fecha de aplicación válida.',
      numeroLote: 'Ingresa el número de lote.',
    })
  })

  it('rejects future application dates', () => {
    expect(validateVaccination({ ...values, fechaAplicacion: '2026-12-01', proximaFecha: '' }, '2026-10-30'))
      .toEqual({ fechaAplicacion: 'La fecha de aplicación no puede ser futura.' })
  })

  it('checks the next date', () => {
    expect(validateVaccination({ ...values, proximaFecha: '2026-10-01' }, '2026-10-30'))
      .toEqual({ proximaFecha: 'La próxima fecha debe ser posterior a la fecha de aplicación.' })
    expect(validateVaccination({ ...values, proximaFecha: '2027-02-31' }, '2026-10-30'))
      .toEqual({ proximaFecha: 'Selecciona una fecha válida.' })
    expect(validateVaccination({ ...values, fechaAplicacion: '', proximaFecha: '2027-01-01' }, '2026-10-30'))
      .toEqual({ fechaAplicacion: 'Selecciona una fecha de aplicación válida.' })
  })

  it('uses today as the default limit', () => {
    expect(validateVaccination({ ...values, fechaAplicacion: '2999-01-01', proximaFecha: '' })).toHaveProperty('fechaAplicacion')
  })

  it('builds the API payload', () => {
    expect(buildVaccinationPayload(values)).toEqual({
      fechaAplicacion: '2026-10-01', proximaFecha: '2027-10-01', numeroLote: 'L-45',
      observacion: 'Sin reacciones', vacuna: { id: 2 }, mascota: { id: 3 },
    })
    expect(buildVaccinationPayload({ ...values, proximaFecha: '', observacion: '' }))
      .toMatchObject({ proximaFecha: null, observacion: null })
  })

  it('lists pets sorted by name', async () => {
    const fetchFn = reply([{ id: 2, nombre: 'Rocky' }, { id: 1, nombre: 'Luna' }])
    const result = await listMascotas({ fetchFn, apiUrl: 'http://api.test' })
    expect(result.mascotas.map((item) => item.nombre)).toEqual(['Luna', 'Rocky'])
    expect(fetchFn.mock.calls[0][0]).toBe('http://api.test/mascotas')
    expect((await listMascotas({ fetchFn: reply({}, false) })).ok).toBe(false)
  })

  it('creates the registration', async () => {
    const fetchFn = reply({ id: 8 })
    expect(await createVaccination(values, { fetchFn, apiUrl: 'http://api.test' })).toEqual({ ok: true, registro: { id: 8 } })
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe('http://api.test/registros-vacunacion')
    expect(options.method).toBe('POST')
  })

  it('reports a rejected registration', async () => {
    const body = { apierror: { message: 'La fecha de aplicación no puede ser futura' } }
    expect(await createVaccination(values, { fetchFn: reply(body, false) })).toEqual({ ok: false, message: 'La fecha de aplicación no puede ser futura' })
  })
})
