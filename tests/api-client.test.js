import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apiRequest,
  CONNECTION_ERROR,
  DEFAULT_API_URL,
  escapeHtml,
  getApiUrl,
  toDateOnly,
  UNEXPECTED_ERROR,
  withData,
} from '../src/api/client.js'

const json = (body, ok = true) => ({ ok, json: async () => body })

afterEach(() => vi.unstubAllGlobals())

describe('getApiUrl', () => {
  it('uses the configured URL without trailing slashes', () => {
    expect(getApiUrl({ VITE_API_URL: ' http://api.test/api// ' })).toBe('http://api.test/api')
  })

  it('falls back to the default URL', () => {
    expect(getApiUrl({})).toBe(DEFAULT_API_URL)
    expect(getApiUrl({ VITE_API_URL: '  ' })).toBe(DEFAULT_API_URL)
  })

  it('reads the Vite environment by default', () => {
    expect(getApiUrl()).toMatch(/^https?:\/\//)
  })
})

describe('apiRequest', () => {
  it('sends GET requests without a body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json([{ id: 1 }]))
    expect(await apiRequest('/vacunas', { fetchFn, apiUrl: 'http://api.test' }))
      .toEqual({ ok: true, data: [{ id: 1 }] })
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/vacunas', { method: 'GET' })
  })

  it('sends JSON bodies', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ id: 2 }))
    await apiRequest('/vacunas', { method: 'POST', body: { nombre: 'Rabia' }, fetchFn, apiUrl: 'http://api.test' })
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/vacunas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"nombre":"Rabia"}',
    })
  })

  it('uses the global fetch and the configured URL by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({}))
    vi.stubGlobal('fetch', fetchMock)
    await apiRequest('/vacunas')
    expect(fetchMock.mock.calls[0][0]).toBe(`${getApiUrl()}/vacunas`)
  })

  it('accepts empty successful responses', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('empty') } })
    expect(await apiRequest('/vacunas/1', { method: 'DELETE', fetchFn })).toEqual({ ok: true, data: {} })
  })

  it('returns the API message on errors', async () => {
    const body = { apierror: { message: 'Ya existe una vacuna con el nombre indicado' } }
    const fetchFn = vi.fn().mockResolvedValue(json(body, false))
    expect(await apiRequest('/vacunas', { fetchFn })).toEqual({ ok: false, message: 'Ya existe una vacuna con el nombre indicado' })
  })

  it.each([{ apierror: {} }, {}])('uses a generic message for %j', async (body) => {
    const fetchFn = vi.fn().mockResolvedValue(json(body, false))
    expect(await apiRequest('/vacunas', { fetchFn })).toEqual({ ok: false, message: UNEXPECTED_ERROR })
  })

  it('reports connection problems', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await apiRequest('/vacunas', { fetchFn })).toEqual({ ok: false, message: CONNECTION_ERROR })
  })
})

describe('helpers', () => {
  it('names the data of successful results and keeps failures', () => {
    expect(withData({ ok: true, data: [1] }, 'items')).toEqual({ ok: true, items: [1] })
    const failure = { ok: false, message: 'error' }
    expect(withData(failure, 'items')).toBe(failure)
  })

  it('keeps only the date part of API timestamps', () => {
    expect(toDateOnly('2026-10-30T05:00:00.000+00:00')).toBe('2026-10-30')
    expect(toDateOnly(null)).toBe('')
  })

  it('escapes HTML', () => {
    expect(escapeHtml(`<b a="1">'&'</b>`)).toBe('&lt;b a=&quot;1&quot;&gt;&#39;&amp;&#39;&lt;/b&gt;')
    expect(escapeHtml(undefined)).toBe('')
  })
})
