import '../style.css'
import { getPetGallery, pets } from '../gallery.js'
import { renderStoryLinks } from '../story-navigation.js'
import { renderStorySidebar } from '../story-sidebar.js'

const app = document.querySelector('#app')

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
        <nav class="gallery-pet-nav" aria-label="Galerías de mascotas">
          ${pets.map((pet) => `<a href="#galeria/${pet.id}">${pet.name}<span>${pet.photos.length} ${pet.photos.length === 1 ? 'foto' : 'fotos'}</span></a>`).join('')}
        </nav>
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

function renderGallery(petId) {
  const gallery = getPetGallery(petId)
  if (gallery.status === 'not-found') {
    galleryView.innerHTML = `
      <div class="gallery-message" role="alert"><span aria-hidden="true">?</span><p class="step-label">MASCOTA NO ENCONTRADA</p><h2>No encontramos a esta mascota</h2><p>Puede que el enlace haya cambiado o que ya no esté disponible.</p><a class="home-primary-action" href="./HU18.html">Explorar mascotas</a></div>
    `
    return
  }

  if (gallery.status === 'empty') {
    galleryView.innerHTML = `
      <div class="gallery-heading"><p class="step-label">GALERÍA DE MASCOTA</p><h2>${gallery.pet.name}</h2><p>${gallery.pet.breed} · ${gallery.pet.age}</p></div>
      <div class="gallery-message" role="status"><span aria-hidden="true">▧</span><h2>Aún no hay fotografías disponibles</h2><p>Estamos preparando las fotos de ${gallery.pet.name}. Vuelve pronto para conocerla mejor.</p></div>
    `
    return
  }

  galleryView.innerHTML = `
    <div class="gallery-heading"><div><p class="step-label">GALERÍA DE MASCOTA</p><h2>${gallery.pet.name}<span class="gallery-count">${gallery.photos.length} fotografías</span></h2><p>${gallery.pet.breed} · ${gallery.pet.age} · ${gallery.pet.location}</p></div><a class="home-primary-action" href="./HU18.html#solicitud">Solicitar adopción <span aria-hidden="true">→</span></a></div>
    <div class="photo-gallery">${gallery.photos.map((photo, index) => `
      <figure class="gallery-photo ${photo.principal ? 'gallery-photo-main' : ''}">
        <img src="${photo.src}" alt="${photo.alt}" loading="${index === 0 ? 'eager' : 'lazy'}">
        ${photo.principal ? '<figcaption>Fotografía principal</figcaption>' : ''}
      </figure>
    `).join('')}</div>
  `
}

function renderRoute() {
  const [, petId = 'mora'] = window.location.hash.slice(1).split('/')
  renderGallery(petId)
}

window.addEventListener('hashchange', renderRoute)
renderRoute()

const menuToggle = document.querySelector('.menu-toggle')
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!expanded))
  menuToggle.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación')
  document.querySelector('.header-nav').classList.toggle('nav-open', !expanded)
})