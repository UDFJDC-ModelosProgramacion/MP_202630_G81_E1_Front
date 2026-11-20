import '../style.css'
import { renderStoryLinks } from '../story-navigation.js'
import { renderStorySidebar } from '../story-sidebar.js'
import { escapeHtml, getApiUrl } from '../api/client.js'
import { listPets, listPhotos } from '../workflows/story-api.js'

const app = document.querySelector('#app')
let pets = []

app.innerHTML = `
  <header class="site-header mx-auto flex items-center justify-between">
    <a class="brand" href="./HU01.html" aria-label="Huellitas, galería de mascotas">
      <span class="brand-mark" aria-hidden="true">🐾</span>
      <span>huellitas<span class="brand-dot">.</span></span>
    </a>
    <nav class="header-nav" id="primary-navigation" aria-label="Navegación principal">
      ${renderStoryLinks('HU01')}
    </nav>
    <button class="menu-toggle" type="button" aria-label="Abrir navegación" aria-controls="primary-navigation" aria-expanded="false">
      <span></span><span></span>
    </button>
  </header>
  <main class="mx-auto w-full gallery-page">
    <div class="story-layout">
      <div class="story-primary">
        <section class="gallery-intro">
          <p class="eyebrow"><span class="eyebrow-dot"></span> HUELLITAS · BOGOTÁ</p>
          <h1>Una historia en cada mirada.</h1>
          <p>Conoce a las mascotas que esperan un hogar a través de sus fotografías.</p>
        </section>
        <nav class="gallery-pet-nav" aria-label="Galerías de mascotas"></nav>
        <section class="gallery-view" id="gallery-view" aria-live="polite"></section>
      </div>
      ${renderStorySidebar({
        sidebarLabel: 'Información de la galería',
        petStatus: 'En adopción',
        petEmoji: '🐕',
        petTitle: 'Historias con hogar',
        petTag: 'HU01',
        petSubtitle: 'Galería de fotografías',
        asideDescription: 'Cada fotografía muestra un poco de la personalidad de quienes esperan una familia.',
        helpTitle: 'Conoce antes de adoptar',
        helpDescription: 'Explora las fotos de cada mascota y descubre quién puede ser tu nueva compañera.',
        helpLink: { href: './HU18.html#solicitud', label: 'Iniciar solicitud de adopción' },
        asideNote: 'Una mirada puede ser el comienzo de una gran historia.',
      })}
    </div>
  </main>
  <footer class="site-footer mx-auto flex items-center justify-between">
    <a class="brand footer-brand" href="./HU01.html"><span class="brand-mark" aria-hidden="true">🐾</span><span>huellitas<span class="brand-dot">.</span></span></a>
    <p>Con amor, cada historia encuentra su hogar.</p>
    <span>© 2026 Huellitas</span>
  </footer>
`

const galleryView = document.querySelector('#gallery-view')
const petNav = document.querySelector('.gallery-pet-nav')
const API_OPTIONS = { apiUrl: getApiUrl(import.meta.env), fetchFn: window.fetch.bind(window) }

function showGalleryMessage(message, type = 'status') {
  galleryView.innerHTML = `<div class="gallery-message" role="${type}"><p>${escapeHtml(message)}</p></div>`
}

function activePetFromRoute() {
  const fragment = window.location.hash.slice(1).split('/')[1]
  if (!fragment) return pets[0]
  return pets.find((pet) => String(pet.id) === fragment
    || pet.name.toLocaleLowerCase('es').replace(/\s+/g, '-') === fragment.toLocaleLowerCase('es'))
}

async function renderGallery() {
  const pet = activePetFromRoute()
  if (!pet) {
    showGalleryMessage(pets.length ? 'No encontramos a esta mascota en el catálogo.' : 'No hay mascotas registradas en el catálogo.', 'alert')
    return
  }

  showGalleryMessage('Cargando fotografías…')
  const result = await listPhotos(pet.id, API_OPTIONS)
  if (!result.ok) {
    galleryView.innerHTML = `<div class="gallery-message" role="alert"><p>${escapeHtml(result.message)}</p><button class="secondary-button" type="button" id="gallery-retry">Reintentar</button></div>`
    galleryView.querySelector('#gallery-retry').addEventListener('click', renderGallery)
    return
  }

  const photos = result.photos.sort((first, second) => Number(second.principal) - Number(first.principal))
  const petName = escapeHtml(pet.name)
  const description = [pet.breed, pet.age === null ? '' : `${pet.age} años`, pet.location].filter(Boolean).map(escapeHtml).join(' · ')
  if (photos.length === 0) {
    galleryView.innerHTML = `
      <div class="gallery-heading"><p class="step-label">GALERÍA DE MASCOTA</p><h2>${petName}</h2><p>${description}</p></div>
      <div class="gallery-message" role="status"><span aria-hidden="true">▧</span><h2>Aún no hay fotografías disponibles</h2><p>Estamos preparando las fotos de ${petName}. Vuelve pronto para conocerla mejor.</p></div>
    `
    return
  }

  galleryView.innerHTML = `
    <div class="gallery-heading"><div><p class="step-label">GALERÍA DE MASCOTA</p><h2>${petName}<span class="gallery-count">${photos.length} fotografías</span></h2><p>${description}</p></div><a class="home-primary-action" href="./HU18.html#solicitud">Solicitar adopción <span aria-hidden="true">→</span></a></div>
    <div class="photo-gallery">${photos.map((photo, index) => `
      <figure class="gallery-photo ${photo.principal ? 'gallery-photo-main' : ''}">
        <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.description || `Fotografía de ${pet.name}`)}" loading="${index === 0 ? 'eager' : 'lazy'}">
        ${photo.principal ? '<figcaption>Fotografía principal</figcaption>' : ''}
      </figure>
    `).join('')}</div>
  `
}

async function loadGallery() {
  showGalleryMessage('Cargando mascotas…')
  const result = await listPets(API_OPTIONS)
  if (!result.ok) {
    petNav.replaceChildren()
    galleryView.innerHTML = `<div class="gallery-message" role="alert"><p>${escapeHtml(result.message)}</p><button class="secondary-button" type="button" id="gallery-retry">Reintentar</button></div>`
    galleryView.querySelector('#gallery-retry').addEventListener('click', loadGallery)
    return
  }

  pets = result.pets
  petNav.innerHTML = pets.map((pet) => `<a href="#galeria/${encodeURIComponent(pet.id)}">${escapeHtml(pet.name)}<span>Ver fotos</span></a>`).join('')
  await renderGallery()
}

window.addEventListener('hashchange', renderGallery)
loadGallery()

const menuToggle = document.querySelector('.menu-toggle')
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!expanded))
  menuToggle.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación')
  document.querySelector('.header-nav').classList.toggle('nav-open', !expanded)
})