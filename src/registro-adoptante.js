import './style.css'
import {
  buildAdoptantePayload,
  registerAdoptante,
  storeAdoptanteId,
  validateAdoptante,
} from './adoptante.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="site-header mx-auto flex items-center justify-between">
    <a class="brand" href="index.html" aria-label="Huellitas, inicio">
      <span class="brand-mark" aria-hidden="true">🐾</span>
      <span>huellitas<span class="brand-dot">.</span></span>
    </a>
    <nav class="header-nav" id="primary-navigation" aria-label="Navegación principal">
      <a href="index.html#mascota">Mascotas</a>
      <a href="registro-adoptante.html" aria-current="page">Registro</a>
      <a class="header-link" href="index.html#solicitud">Mi solicitud <span aria-hidden="true">↗</span></a>
    </nav>
    <button class="menu-toggle" type="button" aria-label="Abrir navegación" aria-controls="primary-navigation" aria-expanded="false">
      <span></span><span></span>
    </button>
  </header>

  <main class="mx-auto w-full">
    <div class="breadcrumb" aria-label="Ruta de navegación">
      <a href="index.html">Inicio</a><span aria-hidden="true">/</span>
      <span aria-current="page">Registro de adoptante</span>
    </div>

    <section class="application-main registro-layout" id="registro">
      <div class="form-heading">
        <div>
          <p class="step-label">REGISTRO DE ADOPTANTE</p>
          <h2>Crea tu perfil de adoptante</h2>
          <p>Con tus datos podrás solicitar la adopción de una mascota.</p>
        </div>
      </div>

      <div id="form-error" class="form-error-banner" role="alert" hidden></div>

      <form id="adoptante-form" novalidate>
        <fieldset class="form-section">
          <legend><span class="section-number">01</span><span>Tus datos</span></legend>
          <p class="section-help">Usaremos estos datos para ponernos en contacto contigo.</p>
          <div class="form-grid grid grid-cols-2 gap-4">
            <div class="field field-full">
              <label for="nombre">Nombre completo <span aria-hidden="true">*</span></label>
              <input id="nombre" name="nombre" autocomplete="name" placeholder="Ej. Camila Rodríguez" required aria-describedby="nombre-error">
              <small class="field-error" id="nombre-error"></small>
            </div>
            <div class="field">
              <label for="email">Correo electrónico <span aria-hidden="true">*</span></label>
              <input id="email" name="email" type="email" autocomplete="email" placeholder="tu@correo.com" required aria-describedby="email-error">
              <small class="field-error" id="email-error"></small>
            </div>
            <div class="field">
              <label for="telefono">Teléfono de contacto <span aria-hidden="true">*</span></label>
              <input id="telefono" name="telefono" type="tel" autocomplete="tel" placeholder="+57 300 123 4567" required aria-describedby="telefono-error">
              <small class="field-error" id="telefono-error"></small>
            </div>
            <div class="field">
              <label for="ciudad">Ciudad <span aria-hidden="true">*</span></label>
              <input id="ciudad" name="ciudad" autocomplete="address-level2" placeholder="¿Dónde vives?" required aria-describedby="ciudad-error">
              <small class="field-error" id="ciudad-error"></small>
            </div>
            <div class="field">
              <label for="direccion">Dirección <span aria-hidden="true">*</span></label>
              <input id="direccion" name="direccion" autocomplete="street-address" placeholder="Barrio y dirección" required aria-describedby="direccion-error">
              <small class="field-error" id="direccion-error"></small>
            </div>
          </div>
        </fieldset>

        <button class="submit-button" id="submit-button" type="submit">
          Registrarme <span aria-hidden="true">→</span>
        </button>
        <p class="required-note"><span aria-hidden="true">*</span> Campos obligatorios</p>
      </form>

      <section id="success-view" class="success-view" aria-live="polite" tabindex="-1" hidden>
        <div class="success-icon" aria-hidden="true">✓</div>
        <p class="eyebrow">¡BIENVENIDO/A!</p>
        <h2>Tu registro fue exitoso</h2>
        <p>Ya eres parte de Huellitas. Ahora puedes solicitar la adopción de una mascota.</p>
        <div class="success-reference">Número de adoptante <strong id="adoptante-reference"></strong></div>
        <a class="secondary-button" href="index.html">Ir al inicio</a>
      </section>
    </section>
  </main>

  <footer class="site-footer mx-auto flex items-center justify-between">
    <a class="brand footer-brand" href="index.html"><span class="brand-mark" aria-hidden="true">🐾</span><span>huellitas<span class="brand-dot">.</span></span></a>
    <p>Con amor, cada historia encuentra su hogar.</p>
    <span>© 2026 Huellitas</span>
  </footer>
`

const form = document.querySelector('#adoptante-form')
const formError = document.querySelector('#form-error')
const successView = document.querySelector('#success-view')
const submitButton = document.querySelector('#submit-button')

const errorMessages = {
  nombre: 'Escribe tu nombre completo.',
  email: 'Ingresa un correo electrónico válido.',
  telefono: 'Ingresa un teléfono válido (mínimo 7 dígitos).',
  ciudad: 'Indica la ciudad donde vives.',
  direccion: 'Indica tu dirección.',
}

function clearErrors() {
  for (const name of Object.keys(errorMessages)) {
    form.elements.namedItem(name).removeAttribute('aria-invalid')
    document.querySelector(`#${name}-error`).textContent = ''
  }
  formError.hidden = true
}

function showFieldErrors(errors) {
  clearErrors()
  const names = Object.keys(errors)
  for (const name of names) {
    form.elements.namedItem(name).setAttribute('aria-invalid', 'true')
    document.querySelector(`#${name}-error`).textContent = errorMessages[name]
  }
  form.elements.namedItem(names[0]).focus()
  formError.textContent = 'Revisa los campos marcados antes de continuar.'
  formError.hidden = false
}

function showServerError(message) {
  formError.textContent = message
  formError.hidden = false
  formError.focus()
}

form.addEventListener('input', (event) => {
  const field = event.target
  field.removeAttribute('aria-invalid')
  document.querySelector(`#${field.name}-error`).textContent = ''
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const values = Object.fromEntries(new FormData(form).entries())
  const errors = validateAdoptante(values)
  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors)
    return
  }

  clearErrors()
  submitButton.disabled = true
  const result = await registerAdoptante(buildAdoptantePayload(values))
  submitButton.disabled = false

  if (!result.ok) {
    showServerError(result.message)
    return
  }

  storeAdoptanteId(result.adoptante.id, window.localStorage)
  document.querySelector('#adoptante-reference').textContent = result.adoptante.id ?? ''
  form.hidden = true
  successView.hidden = false
  successView.focus()
})

const menuToggle = document.querySelector('.menu-toggle')
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!expanded))
  menuToggle.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación')
  document.querySelector('.header-nav').classList.toggle('nav-open', !expanded)
})
