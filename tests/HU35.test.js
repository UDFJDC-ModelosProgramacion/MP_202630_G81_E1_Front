import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_API_URL, PET_NOT_FOUND } from '../src/catalog/catalog.js'
import {
  COMPLETED_MESSAGE,
  FOLLOWUP_FIELDS,
  FOLLOWUP_NOT_FOUND,
  FOLLOWUP_REFS_NOT_FOUND,
  NO_FOLLOWUPS_MESSAGE,
  PET_ID_ERROR,
  buildFollowUpPayload,
  createFollowUp,
  deleteFollowUp,
  ensureEditable,
  fetchFollowUps,
  normalizeFollowUp,
  renderFollowUps,
  updateFollowUp,
  validateFollowUp,
} from '../src/workflows/HU35.js'

const API = 'http://api.test/api'
const res = (body, { ok = true, status = 200 } = {}) => ({ ok, status, json: async () => body })
const brokenJson = ({ ok = true, status = 200 } = {}) => ({ ok, status, json: async () => { throw new SyntaxError('bad') } })
const values = {
  fechaAsignacion: '2026-11-10', proximaCita: '2026-12-10', observacion: 'Vacuna anual', estado: 'Programado',
  mascotaId: '1', veterinarioId: '4',
}
const raw = {
  id: 9, fechaAsignacion: '2026-11-10T08:00:00', proximaCita: '2026-12-10', observacion: 'Vacuna anual',
  estado: 'Programado', mascota: { id: 1 }, veterinario: { id: 4, nombre: 'Dra. Ana Ruiz' },
}

function api(routes) {
  return vi.fn(async (url) => routes[url.replace(API, '')] ?? res({}, { ok: false, status: 404 }))
}

describe('validateFollowUp', () => {
  it('accepts a complete follow-up', () => {
    expect(validateFollowUp(values)).toEqual({})
  })

  it('requires the assignment date, the state, the pet and the veterinarian', () => {
    const errors = validateFollowUp({})
    expect(Object.keys(errors)).toEqual(['fechaAsignacion', 'estado', 'mascotaId', 'veterinarioId'])
    expect(errors.fechaAsignacion).toBe('La fecha de asignación es obligatoria.')
  })

  it('rejects dates with a wrong format', () => {
    expect(validateFollowUp({ ...values, fechaAsignacion: '10/11/2026' }).fechaAsignacion).toContain('fecha de asignación válida')
    expect(validateFollowUp({ ...values, proximaCita: 'mañana' }).proximaCita).toContain('próxima cita válida')
  })

  it('does not accept a next appointment before the assignment date', () => {
    expect(validateFollowUp({ ...values, proximaCita: '2026-11-09' }).proximaCita)
      .toBe('La próxima cita no puede ser anterior a la fecha de asignación.')
  })

  it('accepts a next appointment on the same day, later, or none', () => {
    expect(validateFollowUp({ ...values, proximaCita: '2026-11-10' })).toEqual({})
    expect(validateFollowUp({ ...values, proximaCita: '2027-01-01' })).toEqual({})
    expect(validateFollowUp({ ...values, proximaCita: '' })).toEqual({})
  })

  it('does not compare dates when one of them is missing or invalid', () => {
    expect(validateFollowUp({ ...values, fechaAsignacion: '', proximaCita: '2020-01-01' }).proximaCita).toBeUndefined()
    expect(validateFollowUp({ ...values, fechaAsignacion: 'x', proximaCita: '2020-01-01' }).proximaCita).toBeUndefined()
    expect(validateFollowUp({ ...values, proximaCita: 'x' }).proximaCita).toContain('válida')
  })

  it('validates the state and the numbers', () => {
    expect(validateFollowUp({ ...values, estado: 'Perdido' }).estado).toContain('no es válido')
    expect(validateFollowUp({ ...values, mascotaId: 'x' }).mascotaId).toContain('número positivo')
    expect(validateFollowUp({ ...values, veterinarioId: 'x' }).veterinarioId).toContain('número positivo')
  })

  it('describes every field of the form', () => {
    expect(FOLLOWUP_FIELDS).toHaveLength(6)
  })
})

describe('buildFollowUpPayload', () => {
  it('links the follow-up with a pet and a veterinarian', () => {
    expect(buildFollowUpPayload(values)).toEqual({
      fechaAsignacion: '2026-11-10', proximaCita: '2026-12-10', observacion: 'Vacuna anual', estado: 'Programado',
      mascota: { id: 1 }, veterinario: { id: 4 },
    })
  })

  it('sends null for the optional data left empty', () => {
    const payload = buildFollowUpPayload({ ...values, proximaCita: '', observacion: ' ' })
    expect(payload.proximaCita).toBeNull()
    expect(payload.observacion).toBeNull()
  })
})

describe('normalizeFollowUp', () => {
  it('maps the data of the API and keeps only the day', () => {
    expect(normalizeFollowUp(raw)).toEqual({
      id: 9, fechaAsignacion: '2026-11-10', proximaCita: '2026-12-10', observacion: 'Vacuna anual',
      estado: 'Programado', mascotaId: 1, veterinarioId: 4, veterinario: 'Dra. Ana Ruiz',
    })
  })

  it('uses safe defaults for missing data', () => {
    expect(normalizeFollowUp({})).toEqual({
      id: null, fechaAsignacion: '', proximaCita: '', observacion: '', estado: 'Programado',
      mascotaId: null, veterinarioId: null, veterinario: 'Veterinario no registrado',
    })
  })
})

describe('ensureEditable', () => {
  it('does not allow changing a completed follow-up', () => {
    const error = (() => { try { ensureEditable({ estado: 'Completado' }) } catch (e) { return e } return null })()
    expect(error.message).toBe(COMPLETED_MESSAGE)
    expect(error.status).toBe(409)
  })

  it('allows changing the others', () => {
    expect(ensureEditable({ estado: 'Programado' })).toBeUndefined()
  })
})

describe('createFollowUp', () => {
  it('schedules with POST and returns the follow-up', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(raw, { status: 201 }))
    const created = await createFollowUp(fetchFn, values, API)
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe(`${API}/seguimientos`)
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body).mascota).toEqual({ id: 1 })
    expect(created.id).toBe(9)
  })

  it('accepts a successful reply without a body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 201 }))
    expect(await createFollowUp(fetchFn, values)).toBeNull()
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/seguimientos`)
  })

  it('reports that the pet or the veterinarian does not exist', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 404 }))
    await expect(createFollowUp(fetchFn, values, API)).rejects.toThrow(FOLLOWUP_REFS_NOT_FOUND)
  })

  it('shows the message of the server', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({ apierror: { message: 'Fecha inválida' } }, { ok: false, status: 400 }))
    await expect(createFollowUp(fetchFn, values, API)).rejects.toThrow('Fecha inválida')
  })
})

describe('updateFollowUp and deleteFollowUp', () => {
  it('updates with PUT', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(raw))
    expect((await updateFollowUp(fetchFn, 9, values, API)).id).toBe(9)
    expect(fetchFn.mock.calls[0][0]).toBe(`${API}/seguimientos/9`)
    expect(fetchFn.mock.calls[0][1].method).toBe('PUT')
  })

  it('accepts an update without a body and uses the default API URL', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson())
    expect(await updateFollowUp(fetchFn, 9, values)).toBeNull()
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/seguimientos/9`)
  })

  it('reports that the follow-up was not found', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 404 }))
    await expect(updateFollowUp(fetchFn, 99, values, API)).rejects.toThrow(FOLLOWUP_NOT_FOUND)
    await expect(deleteFollowUp(fetchFn, 99, API)).rejects.toThrow(FOLLOWUP_NOT_FOUND)
  })

  it('deletes with DELETE', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 204 }))
    expect(await deleteFollowUp(fetchFn, 9, API)).toBe(true)
    expect(fetchFn).toHaveBeenCalledWith(`${API}/seguimientos/9`, { method: 'DELETE', headers: { Accept: 'application/json' } })
  })

  it('uses the default API URL to delete', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 204 }))
    await deleteFollowUp(fetchFn, 9)
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/seguimientos/9`)
  })

  it('shows the message of the server when it rejects the change', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({ apierror: { message: COMPLETED_MESSAGE } }, { ok: false, status: 409 }))
    await expect(deleteFollowUp(fetchFn, 9, API)).rejects.toThrow(COMPLETED_MESSAGE)
  })
})

describe('fetchFollowUps', () => {
  it('asks for a valid pet number', async () => {
    const fetchFn = vi.fn()
    await expect(fetchFollowUps(fetchFn, 'abc', API)).rejects.toThrow(PET_ID_ERROR)
    expect(fetchFn.mock.calls).toHaveLength(0)
  })

  it('uses the follow-ups that come inside the pet detail', async () => {
    const fetchFn = api({ '/mascotas/1': res({ nombre: 'Mora', seguimientos: [raw] }) })
    const result = await fetchFollowUps(fetchFn, ' 1 ', API)
    expect(result.petName).toBe('Mora')
    expect(result.followUps).toHaveLength(1)
    expect(fetchFn.mock.calls).toHaveLength(1)
  })

  it('filters the follow-ups of the pet from the general list', async () => {
    const other = { ...raw, id: 10, mascota: { id: 2 } }
    const orphan = { id: 11 }
    const fetchFn = api({ '/mascotas/1': res({ nombre: 'Mora' }), '/seguimientos': res([raw, other, orphan]) })
    const result = await fetchFollowUps(fetchFn, '1', API)
    expect(result.followUps.map((f) => f.id)).toEqual([9])
  })

  it('names pets without a name and uses the default API URL', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({ seguimientos: [] }))
    const result = await fetchFollowUps(fetchFn, 1)
    expect(result.petName).toBe('Mascota sin nombre')
    expect(fetchFn.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/mascotas/1`)
  })

  it('reports that the pet was not found', async () => {
    const error = await fetchFollowUps(api({}), '99', API).catch((e) => e)
    expect(error.message).toBe(PET_NOT_FOUND)
    expect(error.status).toBe(404)
  })

  it('reports unexpected formats and server failures', async () => {
    await expect(fetchFollowUps(api({ '/mascotas/1': res([]) }), '1', API)).rejects.toThrow('formato inesperado')
    const badList = api({ '/mascotas/1': res({ nombre: 'Mora' }), '/seguimientos': res({}) })
    await expect(fetchFollowUps(badList, '1', API)).rejects.toThrow('formato inesperado')
    const failing = vi.fn().mockResolvedValue(res({}, { ok: false, status: 500 }))
    await expect(fetchFollowUps(failing, '1', API)).rejects.toThrow('entregar la mascota')
  })

  it('reports a failure while reading the general list', async () => {
    const fetchFn = api({ '/mascotas/1': res({ nombre: 'Mora' }), '/seguimientos': res({}, { ok: false, status: 500 }) })
    await expect(fetchFollowUps(fetchFn, '1', API)).rejects.toThrow('entregar los seguimientos')
  })
})

describe('renderFollowUps', () => {
  it('tells when the pet has no follow-ups', () => {
    expect(renderFollowUps([])).toContain(NO_FOLLOWUPS_MESSAGE)
  })

  it('lists the follow-ups with edit and delete actions', () => {
    const html = renderFollowUps([normalizeFollowUp(raw), normalizeFollowUp({ id: 2, fechaAsignacion: '2026-01-01', observacion: '<b>x</b>' })])
    expect(html).toContain('próxima cita 2026-12-10')
    expect(html).toContain('Dra. Ana Ruiz')
    expect(html).toContain('data-action="edit" data-id="9"')
    expect(html).toContain('data-action="delete" data-id="2"')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).toContain('data-testid="followup-item"')
  })

  it('omits the note and the next appointment when they are empty', () => {
    const html = renderFollowUps([normalizeFollowUp({ id: 3, fechaAsignacion: '2026-02-02' })])
    expect(html).not.toContain('próxima cita')
    expect(html).not.toContain('<small>Vacuna')
    expect(html.match(/<small>/g)).toHaveLength(1)
  })
})
