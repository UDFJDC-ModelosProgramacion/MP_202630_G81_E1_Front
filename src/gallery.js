export const pets = [
  {
    id: 'mora',
    name: 'Mora',
    age: '2 años',
    breed: 'Criolla · Tamaño mediano',
    location: 'Bogotá',
    photos: [
      {
        src: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=85',
        alt: 'Mora, perrita de pelaje dorado, mirando a la cámara',
        principal: true,
      },
      {
        src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80',
        alt: 'Mora descansando al aire libre',
        principal: false,
      },
      {
        src: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=900&q=80',
        alt: 'Mora jugando en el parque',
        principal: false,
      },
    ],
  },
  {
    id: 'luna',
    name: 'Luna',
    age: '1 año',
    breed: 'Criolla · Tamaño pequeño',
    location: 'Bogotá',
    photos: [],
  },
]

export function getPetGallery(petId, storage = null) {
  const pet = pets.find((candidate) => candidate.id === petId)
  if (!pet) return { status: 'not-found', pet: null, photos: [] }

  let petPhotos = pet.photos
  const saved = storage?.getItem('huellitas.photos')
  if (saved !== null && saved !== undefined) {
    const managedPhotos = JSON.parse(saved)
    if (!Array.isArray(managedPhotos)) throw new TypeError('Las fotografías guardadas deben estar en una lista.')
    petPhotos = managedPhotos
      .filter((photo) => photo.petId === petId)
      .map((photo) => ({ src: photo.url, alt: photo.description || `Fotografía de ${pet.name}`, principal: photo.principal }))
  }
  if (petPhotos.length === 0) return { status: 'empty', pet, photos: [] }

  const photos = [...petPhotos].sort((first, second) => Number(second.principal) - Number(first.principal))
  return { status: 'available', pet, photos }
}