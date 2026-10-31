import { describe, expect, it, vi } from 'vitest'
import { getNotifications } from '../src/workflows/HU17.js'

const reply = (body, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body })

describe('HU17 notifications', () => {
  it('returns the notifications of the adoptante, newest first', async () => {
    const fetchFn = reply([
      { id: 1, fecha: '2026-10-01T05:00:00.000+00:00' },
      { id: 2, fecha: '2026-10-20T05:00:00.000+00:00' },
      { id: 3, fecha: null },
      { id: 4, fecha: '2026-10-10T05:00:00.000+00:00' },
      { id: 5, fecha: null },
    ])
    const result = await getNotifications('4', { fetchFn, apiUrl: 'http://api.test' })
    expect(result.notificaciones.map((item) => item.id)).toEqual([2, 4, 1, 3, 5])
    expect(fetchFn.mock.calls[0][0]).toBe('http://api.test/notificaciones/adoptante/4')
  })

  it('returns an empty list when there are no notifications', async () => {
    expect(await getNotifications('4', { fetchFn: reply([]) })).toEqual({ ok: true, notificaciones: [] })
  })

  it('reports errors', async () => {
    expect((await getNotifications('4', { fetchFn: reply({}, false) })).ok).toBe(false)
  })
})
