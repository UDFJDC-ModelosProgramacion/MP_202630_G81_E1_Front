import { describe, expect, it } from 'vitest'
import { getPetGallery } from '../src/gallery.js'
import {
  createPhoto,
  deletePhoto,
  getPhotos,
  PHOTOS_STORAGE_KEY,
  savePhoto,
  setPrincipalPhoto,
  updatePhoto,
  validatePhoto,
} from '../src/workflows/HU02.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  }
}

const values = { petId: 'mora', url: ' https://images.test/mora.jpg ', description: ' Retrato de Mora ' }
const photo = (id, principal = false, petId = 'mora') => ({ id, petId, petName: petId === 'mora' ? 'Mora' : 'Luna', url: `https://${id}.test/photo.jpg`, description: id, principal })

describe('HU02 photo management', () => {
  it('uses the starter gallery and filters by pet', () => {
    expect(getPhotos(memoryStorage())).toHaveLength(3)
    expect(getPhotos(memoryStorage(), 'luna')).toEqual([])
    expect(() => getPhotos(memoryStorage(), 'unknown')).toThrow('La mascota seleccionada no existe.')
  })

  it('validates pet selection and image URL', () => {
    expect(validatePhoto({})).toMatchObject({ petId: 'Selecciona una mascota.', url: 'Ingresa una URL válida para la fotografía.' })
    expect(validatePhoto({ petId: 'unknown', url: 'file:///image.png' })).toMatchObject({
      petId: 'La mascota seleccionada no existe.',
      url: 'Ingresa una URL válida para la fotografía.',
    })
    expect(validatePhoto(values)).toEqual({})
  })

  it('creates a normalized photo linked to its pet', () => {
    expect(createPhoto(values, { id: 'mora-new' })).toEqual({
      id: 'mora-new', petId: 'mora', petName: 'Mora', url: 'https://images.test/mora.jpg',
      description: 'Retrato de Mora', principal: false,
    })
    expect(createPhoto({ ...values, principal: true }, { id: 'main' }).principal).toBe(true)
  })

  it('adds a photo and promotes it when the pet has none marked principal', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('existing', false)]) })
    const added = createPhoto(values, { id: 'added' })
    savePhoto(storage, added)
    expect(getPhotos(storage, 'mora').map((item) => item.principal)).toEqual([false, true])
  })

  it('keeps an existing principal when adding a photo without promoting it', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('existing', true)]) })
    savePhoto(storage, createPhoto(values, { id: 'added' }))
    expect(getPhotos(storage).map((item) => item.principal)).toEqual([true, false])
  })

  it('adds a marked principal and clears the previous principal', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('old', true), photo('luna', false, 'luna')]) })
    savePhoto(storage, createPhoto(values, { id: 'new', principal: true }))
    expect(getPhotos(storage).map((item) => item.principal)).toEqual([false, false, true])
  })

  it('rejects invalid pets and duplicate photo ids', () => {
    expect(() => savePhoto(memoryStorage(), photo('bad', false, 'missing'))).toThrow('La mascota asociada no existe.')
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('same')]) })
    expect(() => savePhoto(storage, photo('same'))).toThrow('La fotografía ya está registrada.')
  })

  it('edits a photo, can promote it, and rejects missing or invalid edits', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('one'), photo('two', true), photo('luna', false, 'luna')]) })
    const edited = updatePhoto(storage, 'one', { url: 'https://new.test/one.jpg', description: 'Nueva', principal: true })
    expect(edited).toMatchObject({ url: 'https://new.test/one.jpg', description: 'Nueva', principal: true })
    expect(getPhotos(storage).find((item) => item.id === 'two').principal).toBe(false)
    expect(updatePhoto(storage, 'one', { url: 'https://new.test/one.jpg', description: '', principal: false }).principal).toBe(true)
    expect(() => updatePhoto(storage, 'missing', values)).toThrow('No encontramos la fotografía que quieres editar.')
    expect(() => updatePhoto(storage, 'one', { url: 'nope' })).toThrow('Ingresa una URL válida para la fotografía.')
    const orphanStorage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('orphan', false, 'missing')]) })
    expect(() => updatePhoto(orphanStorage, 'orphan', values)).toThrow('La mascota asociada no existe.')
  })

  it('sets the principal photo and reports invalid pet/photo references', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('one', true), photo('two'), photo('luna', true, 'luna')]) })
    setPrincipalPhoto(storage, 'mora', 'two')
    expect(getPhotos(storage, 'mora').map((item) => item.principal)).toEqual([false, true])
    expect(() => setPrincipalPhoto(storage, 'missing', 'two')).toThrow('La mascota asociada no existe.')
    expect(() => setPrincipalPhoto(storage, 'mora', 'missing')).toThrow('No encontramos la fotografía de esta mascota.')
  })

  it('deletes photos and promotes a replacement when the principal is removed', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('main', true), photo('next'), photo('luna', true, 'luna')]) })
    deletePhoto(storage, 'mora', 'main')
    expect(getPhotos(storage, 'mora')).toMatchObject([{ id: 'next', principal: true }])
    deletePhoto(storage, 'mora', 'next')
    expect(getPhotos(storage, 'mora')).toEqual([])
    expect(() => deletePhoto(storage, 'missing', 'luna')).toThrow('La mascota asociada no existe.')
    expect(() => deletePhoto(storage, 'mora', 'missing')).toThrow('No encontramos la fotografía de esta mascota.')
  })

  it('allows deleting the last principal photo without promoting a replacement', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('only', true)]) })
    deletePhoto(storage, 'mora', 'only')
    expect(getPhotos(storage, 'mora')).toEqual([])
  })

  it('deletes a non-principal photo without changing the existing principal', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('main', true), photo('secondary')]) })
    deletePhoto(storage, 'mora', 'secondary')
    expect(getPhotos(storage, 'mora')).toMatchObject([{ id: 'main', principal: true }])
  })

  it('makes managed photos visible in the public gallery', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('managed', true)]) })
    expect(getPetGallery('mora', storage).photos).toEqual([
      { src: 'https://managed.test/photo.jpg', alt: 'managed', principal: true },
    ])
    storage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify({ invalid: true }))
    expect(() => getPetGallery('mora', storage)).toThrow('Las fotografías guardadas deben estar en una lista.')
  })

  it('uses only managed photos when HU02 has saved a collection', () => {
    const storage = memoryStorage({ [PHOTOS_STORAGE_KEY]: JSON.stringify([photo('luna-only', true, 'luna')]) })
    expect(getPetGallery('mora', storage).status).toBe('empty')
    expect(getPetGallery('luna', storage).photos).toMatchObject([
      { src: 'https://luna-only.test/photo.jpg', principal: true },
    ])
  })
})
