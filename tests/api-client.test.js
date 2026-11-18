import { describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  GENERIC_FAILURE,
  NETWORK_FAILURE,
  UNEXPECTED_FORMAT,
  expectList,
  expectObject,
  isDate,
  isEmail,
  isId,
  isObject,
  orNull,
  parseIdParam,
  readServerMessage,
  requestJson,
  requiredErrors,
  text,
  trimValues,
  validateId,
} from '../src/api-client.js'

const res = (body, { ok = true, status = 200 } = {}) => ({ ok, status, json: async () => body })
const brokenJson = ({ ok = true, status = 200 } = {}) => ({ ok, status, json: async () => { throw new SyntaxError('bad') } })

describe('ApiError', () => {
  it('keeps the message and the status', () => {
    expect(new ApiError('x').status).toBeNull()
    expect(new ApiError('x', { status: 409 }).status).toBe(409)
    expect(new ApiError('x')).toBeInstanceOf(Error)
  })
})

describe('readServerMessage', () => {
  it('reads the message sent by the back (apierror)', async () => {
    expect(await readServerMessage(res({ apierror: { message: ' Con seguimientos ' } }))).toBe('Con seguimientos')
  })

  it('returns an empty text when there is no usable message', async () => {
    expect(await readServerMessage(res({ apierror: { message: 42 } }))).toBe('')
    expect(await readServerMessage(res({ message: 'otro' }))).toBe('')
    expect(await readServerMessage(res(null))).toBe('')
    expect(await readServerMessage(brokenJson())).toBe('')
  })
})

describe('requestJson', () => {
  it('uses GET with the default options', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({ ok: true }))
    expect(await requestJson(fetchFn, 'http://api/x')).toEqual({ ok: true })
    expect(fetchFn).toHaveBeenCalledWith('http://api/x', { method: 'GET', headers: { Accept: 'application/json' } })
  })

  it('sends a JSON body when one is given', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({ id: 1 }, { status: 201 }))
    await requestJson(fetchFn, 'http://api/x', { method: 'POST', body: { a: 1 }, notFound: 'nf', failure: 'f' })
    expect(fetchFn).toHaveBeenCalledWith('http://api/x', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{"a":1}',
    })
  })

  it('reports network failures', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(requestJson(fetchFn, 'http://api/x')).rejects.toThrow(NETWORK_FAILURE)
  })

  it('reports a not found only when the caller gives a message for it', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res({}, { ok: false, status: 404 }))
    const withMessage = await requestJson(fetchFn, 'http://api/x', { notFound: 'No existe' }).catch((e) => e)
    expect(withMessage.message).toBe('No existe')
    expect(withMessage.status).toBe(404)
    const without = await requestJson(fetchFn, 'http://api/x').catch((e) => e)
    expect(without.message).toBe(GENERIC_FAILURE)
    expect(without.status).toBe(404)
  })

  it('shows the message of the server or the one of the caller', async () => {
    const rejected = vi.fn().mockResolvedValue(res({ apierror: { message: 'Tiene seguimientos' } }, { ok: false, status: 409 }))
    const error = await requestJson(rejected, 'http://api/x', { failure: 'f' }).catch((e) => e)
    expect(error.message).toBe('Tiene seguimientos')
    expect(error.status).toBe(409)

    const silent = vi.fn().mockResolvedValue(res(null, { ok: false, status: 500 }))
    expect((await requestJson(silent, 'http://api/x', { failure: 'Falló esto' }).catch((e) => e)).message).toBe('Falló esto')
  })

  it('accepts a successful reply without a body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(brokenJson({ status: 204 }))
    expect(await requestJson(fetchFn, 'http://api/x', { method: 'DELETE' })).toBeNull()
  })
})

describe('helpers', () => {
  it('detects objects, ids, emails and dates', () => {
    expect(isObject({})).toBe(true)
    expect(isObject(null)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject('x')).toBe(false)
    expect(isId('12')).toBe(true)
    expect(isId('-1')).toBe(false)
    expect(isId('a')).toBe(false)
    expect(isEmail('a@b.co')).toBe(true)
    expect(isEmail('a@b')).toBe(false)
    expect(isDate('2026-11-09')).toBe(true)
    expect(isDate('09/11/2026')).toBe(false)
    expect(orNull('')).toBeNull()
    expect(orNull('x')).toBe('x')
  })

  it('expects a single object or a list', () => {
    expect(expectObject({ a: 1 })).toEqual({ a: 1 })
    expect(() => expectObject(null)).toThrow(UNEXPECTED_FORMAT)
    expect(() => expectObject([])).toThrow(UNEXPECTED_FORMAT)
    expect(expectList([1])).toEqual([1])
    expect(() => expectList({})).toThrow(UNEXPECTED_FORMAT)
  })

  it('cleans text', () => {
    expect(text('  hola ')).toBe('hola')
    expect(text('   ', 'x')).toBe('x')
    expect(text(5, 'x')).toBe('x')
    expect(text(undefined)).toBe('')
  })

  it('validates ids', () => {
    expect(validateId(' 5 ', 'malo')).toBe('')
    expect(validateId(7, 'malo')).toBe('')
    expect(validateId('abc', 'malo')).toBe('malo')
    expect(validateId('', 'malo')).toBe('malo')
  })

  it('trims values and reports the required ones', () => {
    const fields = [{ name: 'a', required: 'A es obligatorio.' }, { name: 'b', required: 'B es obligatorio.' }, { name: 'c' }]
    const clean = trimValues({ a: '  x ', c: undefined }, fields)
    expect(clean).toEqual({ a: 'x', b: '', c: '' })
    expect(requiredErrors(clean, fields)).toEqual({ b: 'B es obligatorio.' })
  })

  it('reads the id from the address', () => {
    expect(parseIdParam()).toEqual({ present: false, id: null })
    expect(parseIdParam('?otro=1')).toEqual({ present: false, id: null })
    expect(parseIdParam('?id=7')).toEqual({ present: true, id: '7' })
    expect(parseIdParam('?id=abc')).toEqual({ present: true, id: null })
  })
})
