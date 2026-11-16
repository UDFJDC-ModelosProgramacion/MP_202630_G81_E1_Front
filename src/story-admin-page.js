import './style.css'
import { renderStoryLinks } from './story-navigation.js'
import { renderStorySidebar } from './story-sidebar.js'

export function mountAdminPage({ storyId, eyebrow, title, description, sidebar, content }) {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <header class="site-header mx-auto flex items-center justify-between">
      <a class="brand" href="./HU18.html" aria-label="Huellitas, inicio">
        <span class="brand-mark" aria-hidden="true">🐾</span>
        <span>huellitas<span class="brand-dot">.</span></span>
      </a>
      <nav class="header-nav" id="primary-navigation" aria-label="Navegación principal">
        ${renderStoryLinks(storyId)}
      </nav>
      <button class="menu-toggle" type="button" aria-label="Abrir navegación" aria-controls="primary-navigation" aria-expanded="false">
        <span></span><span></span>
      </button>
    </header>
    <main class="mx-auto w-full">
      <section class="page-intro">
        <div class="intro-copy">
          <p class="eyebrow"><span class="eyebrow-dot"></span> ${eyebrow}</p>
          <h1>${title}</h1>
          <p class="intro-text">${description}</p>
        </div>
        <div class="intro-decoration" aria-hidden="true">
          <span class="sun-shape"></span><span class="intro-paw">🐾</span>
          <span class="intro-sparkle sparkle-one">✳</span><span class="intro-sparkle sparkle-two">✳</span>
        </div>
      </section>
      <div class="breadcrumb" aria-label="Ruta de navegación">
        <a href="./HU18.html">Huellitas</a><span aria-hidden="true">/</span>
        <span aria-current="page">${storyId} · ${title}</span>
      </div>
      <div class="story-layout">
        <section class="admin-main story-primary">${content}</section>
        ${renderStorySidebar(sidebar)}
      </div>
    </main>
    <footer class="site-footer mx-auto flex items-center justify-between">
      <a class="brand footer-brand" href="./HU18.html"><span class="brand-mark" aria-hidden="true">🐾</span><span>huellitas<span class="brand-dot">.</span></span></a>
      <p>Con amor, cada historia encuentra su hogar.</p>
      <span>© 2026 Huellitas</span>
    </footer>
  `

  const menuToggle = document.querySelector('.menu-toggle')
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
    menuToggle.setAttribute('aria-expanded', String(!expanded))
    menuToggle.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación')
    document.querySelector('.header-nav').classList.toggle('nav-open', !expanded)
  })

  return document.querySelector('.admin-main')
}