import '../style.css'
import { renderStoryLinks } from '../story-navigation.js'
import { renderStorySidebar } from '../story-sidebar.js'
import {
  createApplication,
  getStoredApplications,
  saveApplication,
  validateApplication,
} from '../workflows/HU18.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="site-header mx-auto flex items-center justify-between">
    <a class="brand" href="#inicio" aria-label="Huellitas, inicio">
      <span class="brand-mark" aria-hidden="true">🐾</span>
      <span>huellitas<span class="brand-dot">.</span></span>
    </a>
    <nav class="header-nav" id="primary-navigation" aria-label="Navegación principal">
      <a href="#inicio">Inicio</a>
      <a href="./HU01.html#galeria/mora">Galería</a>
      <a class="header-link" href="#solicitud">Mi solicitud <span aria-hidden="true">↗</span></a>
      ${renderStoryLinks('HU18')}
    </nav>
    <button class="menu-toggle" type="button" aria-label="Abrir navegación" aria-controls="primary-navigation" aria-expanded="false">
      <span></span><span></span>
    </button>
  </header>

  <main class="mx-auto w-full">
    <section class="home-view" id="home-view">
      <div class="home-hero">
        <div class="home-copy">
          <p class="eyebrow"><span class="eyebrow-dot"></span> REFUGIO HUELLITAS · BOGOTÁ</p>
          <h1>Una mirada puede <span>cambiarlo todo.</span></h1>
          <p>Conoce a quienes esperan un hogar. Mira sus historias, descubre sus personalidades y encuentra a tu nueva compañera de vida.</p>
          <a class="home-primary-action" href="./HU01.html#galeria/mora">Conocer a Mora <span aria-hidden="true">→</span></a>
        </div>
        <div class="home-hero-photo">
          <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=85" alt="Perrita de pelaje dorado mirando a la cámara">
          <span class="photo-caption"><span>EN ADOPCIÓN</span><strong>Mora, 2 años</strong></span>
        </div>
      </div>
      <div class="home-section-heading">
        <div><p class="step-label">UN HOGAR LOS ESPERA</p><h2>Historias por conocer</h2></div>
        <a href="./HU01.html#galeria/mora">Ver galería <span aria-hidden="true">↗</span></a>
      </div>
      <div class="home-pet-list">
        <article class="home-pet-row">
          <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80" alt="Retrato de Mora">
          <div><span class="pet-status">EN ADOPCIÓN</span><h3>Mora</h3><p>Criolla · 2 años · Bogotá</p></div>
          <a href="./HU01.html#galeria/mora" aria-label="Ver galería de Mora">Ver fotos <span aria-hidden="true">→</span></a>
        </article>
        <article class="home-pet-row pet-without-photo">
          <div class="pet-initial" aria-hidden="true">L</div>
          <div><span class="pet-status">EN ADOPCIÓN</span><h3>Luna</h3><p>Criolla · 1 año · Bogotá</p></div>
          <a href="./HU01.html#galeria/luna" aria-label="Ver galería de Luna">Ver fotos <span aria-hidden="true">→</span></a>
        </article>
      </div>
      <section class="home-steps" id="proceso">
        <p class="step-label">UN PROCESO ACOMPAÑADO</p><h2>El primer paso empieza por conocerla.</h2>
        <a href="#solicitud">Iniciar solicitud de adopción <span aria-hidden="true">→</span></a>
      </section>
    </section>

    <div id="adoption-view" hidden>
    <section class="page-intro">
      <div class="intro-copy">
        <p class="eyebrow"><span class="eyebrow-dot"></span> UN NUEVO COMIENZO TE ESPERA</p>
        <h1>Una familia para <span>siempre.</span></h1>
        <p class="intro-text">Completa tu solicitud y demos juntos el primer paso para que una vida cambie para siempre.</p>
      </div>
      <div class="intro-decoration" aria-hidden="true">
        <span class="sun-shape"></span>
        <span class="intro-paw">🐾</span>
        <span class="intro-sparkle sparkle-one">✳</span>
        <span class="intro-sparkle sparkle-two">✳</span>
      </div>
    </section>

    <div class="breadcrumb" aria-label="Ruta de navegación">
      <a href="#mascota">Mascotas</a><span aria-hidden="true">/</span>
      <a href="#mascota">Mora</a><span aria-hidden="true">/</span>
      <span aria-current="page">Solicitud de adopción</span>
    </div>

    <section class="application-layout grid items-start" id="solicitud">
      <div class="application-main">
        <div class="form-heading">
          <div>
            <p class="step-label">SOLICITUD DE ADOPCIÓN</p>
            <h2>Cuéntanos sobre ti</h2>
            <p>Queremos conocerte un poquito para encontrar el mejor hogar para Mora.</p>
          </div>
          <div class="step-indicator" aria-label="Formulario de solicitud">
            <span class="step-current">01</span>
          </div>
        </div>

        <div id="form-error" class="form-error-banner" role="alert" hidden>
          Revisa los campos marcados antes de continuar.
        </div>

        <form id="adoption-form" novalidate>
          <fieldset class="form-section">
            <legend><span class="section-number">01</span><span>Sobre ti</span></legend>
            <p class="section-help">Tus datos nos ayudan a ponernos en contacto contigo.</p>
            <div class="form-grid grid grid-cols-2 gap-4">
              <div class="field field-full">
                <label for="fullName">Nombre completo <span aria-hidden="true">*</span></label>
                <input id="fullName" name="fullName" autocomplete="name" placeholder="Ej. Camila Rodríguez" required aria-describedby="fullName-error">
                <small class="field-error" id="fullName-error"></small>
              </div>
              <div class="field">
                <label for="email">Correo electrónico <span aria-hidden="true">*</span></label>
                <input id="email" name="email" type="email" autocomplete="email" placeholder="tu@correo.com" required aria-describedby="email-error">
                <small class="field-error" id="email-error"></small>
              </div>
              <div class="field">
                <label for="phone">Teléfono de contacto <span aria-hidden="true">*</span></label>
                <input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="+57 300 123 4567" required aria-describedby="phone-error">
                <small class="field-error" id="phone-error"></small>
              </div>
              <div class="field">
                <label for="city">Ciudad <span aria-hidden="true">*</span></label>
                <input id="city" name="city" autocomplete="address-level2" placeholder="¿Dónde vives?" required aria-describedby="city-error">
                <small class="field-error" id="city-error"></small>
              </div>
              <div class="field">
                <label for="address">Dirección <span aria-hidden="true">*</span></label>
                <input id="address" name="address" autocomplete="street-address" placeholder="Barrio y dirección" required aria-describedby="address-error">
                <small class="field-error" id="address-error"></small>
              </div>
            </div>
          </fieldset>

          <fieldset class="form-section">
            <legend><span class="section-number">02</span><span>Tu hogar</span></legend>
            <p class="section-help">Cada detalle cuenta para asegurar una buena adaptación.</p>
            <div class="form-grid grid grid-cols-2 gap-4">
              <div class="field">
                <label for="housing">¿En qué tipo de vivienda vives? <span aria-hidden="true">*</span></label>
                <select id="housing" name="housing" required aria-describedby="housing-error">
                  <option value="">Selecciona una opción</option>
                  <option value="Casa">Casa</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Otro">Otro</option>
                </select>
                <small class="field-error" id="housing-error"></small>
              </div>
              <div class="field">
                <label for="household">¿Con quién vives? <span aria-hidden="true">*</span></label>
                <select id="household" name="household" required aria-describedby="household-error">
                  <option value="">Selecciona una opción</option>
                  <option value="Vivo solo/a">Vivo solo/a</option>
                  <option value="Con mi pareja">Con mi pareja</option>
                  <option value="Con mi familia">Con mi familia</option>
                  <option value="Con compañeros/as">Con compañeros/as</option>
                </select>
                <small class="field-error" id="household-error"></small>
              </div>
              <div class="field field-full">
                <label for="experience">¿Has convivido antes con mascotas? <span aria-hidden="true">*</span></label>
                <select id="experience" name="experience" required aria-describedby="experience-error">
                  <option value="">Selecciona una opción</option>
                  <option value="Sí, actualmente tengo mascotas">Sí, actualmente tengo mascotas</option>
                  <option value="Sí, tuve mascotas antes">Sí, tuve mascotas antes</option>
                  <option value="No, sería mi primera vez">No, sería mi primera vez</option>
                </select>
                <small class="field-error" id="experience-error"></small>
              </div>
            </div>
          </fieldset>

          <fieldset class="form-section">
            <legend><span class="section-number">03</span><span>Tu plan para Mora</span></legend>
            <p class="section-help">Cuéntanos qué tienes en mente y qué los hace una buena dupla.</p>
            <div class="field field-full reason-field">
              <label for="reason">¿Por qué quieres adoptar a Mora? <span aria-hidden="true">*</span></label>
              <textarea id="reason" name="reason" rows="4" maxlength="500" placeholder="Cuéntanos qué te motiva y cómo imaginas su llegada a casa..." required aria-describedby="reason-error reason-counter"></textarea>
              <div class="textarea-meta"><small class="field-error" id="reason-error"></small><small id="reason-counter">0 / 500</small></div>
            </div>
          </fieldset>

          <label class="consent-row">
            <input id="consent" name="consent" type="checkbox" required>
            <span class="custom-checkbox" aria-hidden="true"></span>
            <span>Confirmo que la información es correcta y acepto que el refugio se comunique conmigo sobre esta solicitud. <span aria-hidden="true">*</span></span>
          </label>
          <small class="field-error consent-error" id="consent-error"></small>
          <p class="privacy-note"><span aria-hidden="true">♧</span> Tu información solo será compartida con el refugio que acompaña a Mora.</p>

          <button class="submit-button" type="submit">
            Enviar solicitud <span aria-hidden="true">→</span>
          </button>
          <p class="required-note"><span aria-hidden="true">*</span> Campos obligatorios</p>
        </form>

        <section id="success-view" class="success-view" aria-live="polite" tabindex="-1" hidden>
          <div class="success-icon" aria-hidden="true">✓</div>
          <p class="eyebrow">¡UN GRAN PASO!</p>
          <h2>Tu solicitud está en camino</h2>
          <p>Gracias por abrir tu corazón. El equipo de Huellitas revisará tu información y se pondrá en contacto contigo pronto.</p>
          <div class="success-reference">Número de solicitud <strong id="application-reference"></strong></div>
          <button id="new-application" class="secondary-button" type="button">Volver a la solicitud</button>
        </section>
      </div>

      ${renderStorySidebar({
        sidebarLabel: 'Resumen de la mascota seleccionada',
        petStatus: 'En adopción',
        petEmoji: '🐕',
        petTitle: 'Mora',
        petTag: '2 años',
        petSubtitle: 'Criolla · Tamaño mediano',
        asideDescription: 'Una compañera dulce y curiosa que está lista para llenar tu hogar de alegría.',
        helpTitle: '¿Qué pasa después?',
        helpDescription: 'El equipo de Huellitas te acompaña durante todo el proceso.',
        helpSteps: [
          ['Revisamos tu solicitud', 'El refugio se pondrá en contacto contigo.'],
          ['Conversamos y nos conocemos', 'Resolveremos tus dudas y coordinaremos una visita.'],
          ['Un nuevo hogar comienza', 'Acompañamos cada paso de la adaptación.'],
        ],
        helpLink: { href: 'mailto:hola@huellitas.org', label: '¿Tienes dudas? Escríbenos' },
        asideNote: 'Adoptar es un compromiso para toda la vida.',
      })}
    </section>
    </div>
  </main>

  <footer class="site-footer mx-auto flex items-center justify-between">
    <a class="brand footer-brand" href="#inicio"><span class="brand-mark" aria-hidden="true">🐾</span><span>huellitas<span class="brand-dot">.</span></span></a>
    <p>Con amor, cada historia encuentra su hogar.</p>
    <span>© 2026 Huellitas</span>
  </footer>
`

const homeView = document.querySelector('#home-view')
const adoptionView = document.querySelector('#adoption-view')

function renderRoute() {
  const [route, petId] = window.location.hash.slice(1).split('/')
  homeView.hidden = route !== 'inicio' && route !== ''
  adoptionView.hidden = route !== 'solicitud'
}

window.addEventListener('hashchange', renderRoute)
renderRoute()

const form = document.querySelector('#adoption-form')
const formError = document.querySelector('#form-error')
const successView = document.querySelector('#success-view')
const reasonInput = document.querySelector('#reason')

const errorMessages = {
  fullName: 'Escribe tu nombre completo.',
  email: 'Ingresa un correo electrónico válido.',
  phone: 'Ingresa un teléfono válido (mínimo 7 dígitos).',
  city: 'Indica la ciudad donde vives.',
  address: 'Indica tu dirección.',
  housing: 'Selecciona el tipo de vivienda.',
  household: 'Cuéntanos con quién vives.',
  experience: 'Selecciona una opción sobre tu experiencia.',
  reason: 'Cuéntanos por qué quieres adoptar a Mora.',
  consent: 'Debes aceptar para enviar tu solicitud.',
}

function clearFieldErrors() {
  for (const [name] of Object.entries(errorMessages)) {
    const field = form.elements.namedItem(name)
    const error = document.querySelector(`#${name}-error`)
    if (field instanceof RadioNodeList) {
      for (const input of field) input.removeAttribute('aria-invalid')
    } else if (field) {
      field.removeAttribute('aria-invalid')
    }
    if (error) error.textContent = ''
  }
  formError.hidden = true
}

function showFieldErrors(errors) {
  clearFieldErrors()
  const firstInvalid = Object.keys(errors)[0]
  for (const [name, message] of Object.entries(errors)) {
    const field = form.elements.namedItem(name)
    if (field instanceof RadioNodeList) {
      for (const input of field) input.setAttribute('aria-invalid', 'true')
    } else if (field) {
      field.setAttribute('aria-invalid', 'true')
    }
    const error = document.querySelector(`#${name}-error`)
    if (error) error.textContent = errorMessages[name]
    if (name === firstInvalid) {
      const firstInput = field instanceof RadioNodeList ? field[0] : field
      firstInput?.focus()
    }
  }
  formError.hidden = false
}

function updateCharacterCount() {
  document.querySelector('#reason-counter').textContent = `${reasonInput.value.length} / 500`
}

form.addEventListener('input', (event) => {
  const field = event.target
  field.removeAttribute('aria-invalid')
  const error = document.querySelector(`#${field.name}-error`)
  if (error) error.textContent = ''
  if (field === reasonInput) updateCharacterCount()
})

form.addEventListener('change', (event) => {
  if (event.target.name === 'consent') {
    event.target.removeAttribute('aria-invalid')
    document.querySelector('#consent-error').textContent = ''
  }
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const values = Object.fromEntries(new FormData(form).entries())
  values.consent = form.elements.namedItem('consent').checked
  const errors = validateApplication(values)
  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors)
    return
  }

  clearFieldErrors()
  const application = createApplication(values)
  saveApplication(application, window.localStorage)
  document.querySelector('#application-reference').textContent = application.id
  form.hidden = true
  successView.hidden = false
  successView.focus()
})

document.querySelector('#new-application').addEventListener('click', () => {
  form.reset()
  updateCharacterCount()
  successView.hidden = true
  form.hidden = false
  document.querySelector('#fullName').focus()
})

const menuToggle = document.querySelector('.menu-toggle')
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!expanded))
  menuToggle.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación')
  document.querySelector('.header-nav').classList.toggle('nav-open', !expanded)
})
