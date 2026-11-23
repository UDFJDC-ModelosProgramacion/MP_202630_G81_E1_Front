import '../style.css'
import '../HU22.css'

import { renderStoryLinks } from '../story-navigation.js'
import { renderStorySidebar } from '../story-sidebar.js'

import {
  validateUpdate,
  createUpdate,
  getStoredUpdates,
  saveUpdate,
} from '../workflows/HU22.js'

const app = document.querySelector('#app')

// Aca construimos la interfaz utilizando los mismos
// componentes del resto de historias de usuario.

app.innerHTML = `
  <header class="site-header mx-auto flex items-center justify-between">

    <a class="brand" href="./HU01.html" aria-label="Huellitas, inicio">
      <span class="brand-mark" aria-hidden="true">🐾</span>
      <span>huellitas<span class="brand-dot">.</span></span>
    </a>

    <nav class="header-nav"
         id="primary-navigation"
         aria-label="Navegación principal">
      ${renderStoryLinks('HU22')}
    </nav>

    <button class="menu-toggle"
            type="button"
            aria-label="Abrir navegación"
            aria-controls="primary-navigation"
            aria-expanded="false">
      <span></span>
      <span></span>
    </button>

  </header>

  <main class="mx-auto w-full hu22-main">

    <div class="story-layout">

      <div class="story-primary">

        <section class="page-intro">

          <div class="intro-copy">

            <p class="eyebrow">
              <span class="eyebrow-dot"></span>
              REGISTRO Y SEGUIMIENTO
            </p>

            <h1>Cada cambio cuenta una historia.</h1>

            <p class="intro-text">
              Registra cambios importantes relacionados con una
              mascota o un adoptante durante el proceso de adopción.
            </p>

          </div>

        </section>

        <div class="breadcrumb" aria-label="Ruta de navegación">

          <a href="./index.html">Huellitas</a>

          <span aria-hidden="true">/</span>

          <span aria-current="page">
            HU22 · Registrar actualizaciones
          </span>

        </div>

        <section class="hu22-panel" aria-labelledby="form-title">

          <div class="hu22-heading">

            <p class="step-label">HU22 · REGISTRO DE SEGUIMIENTO</p>

            <h2 id="form-title">Registrar actualización</h2>

            <p>
              Completa la información para registrar una nueva
              actualización de seguimiento.
            </p>

          </div>

          <div id="form-feedback"
               role="alert"
               aria-live="polite">
          </div>

          <form id="update-form" class="hu22-form" novalidate>

            <div class="hu22-field">

              <label for="target-type">
                ¿A quién corresponde?
              </label>

              <select id="target-type" name="targetType" required>

                <option value="">Selecciona una opción</option>
                <option value="mascota">Mascota</option>
                <option value="adoptante">Adoptante</option>

              </select>

              <small id="target-type-error"></small>

            </div>

            <div class="hu22-field">

              <label for="target-id">
                Identificador de la mascota o adoptante
              </label>

              <input id="target-id"
                     name="targetId"
                     type="text"
                     required
                     maxlength="80"
                     placeholder="Ej. MASC-001" />

              <small id="target-id-error"></small>

            </div>

            <div class="hu22-field hu22-full">

              <label for="title">
                Título de la actualización
              </label>

              <input id="title"
                     name="title"
                     type="text"
                     required
                     maxlength="100"
                     placeholder="Ej. Adaptación al nuevo entorno" />

              <small id="title-error"></small>

            </div>

            <div class="hu22-field hu22-full">

              <label for="description">Descripción</label>

              <textarea id="description"
                        name="description"
                        rows="5"
                        maxlength="1000"
                        required
                        placeholder="Describe el cambio o situación relevante..."></textarea>

              <small id="description-error"></small>

            </div>

            <div class="hu22-actions">

              <button class="submit-button" type="submit">
                Registrar actualización
              </button>

              <a class="secondary-button" href="./HU23.html">
                Consultar historial
              </a>

            </div>

          </form>

          <p id="success-message" role="status" hidden></p>

        </section>

        <section class="hu22-panel" aria-labelledby="history-title">

          <div class="hu22-heading">

            <p class="step-label">REGISTROS DISPONIBLES</p>

            <h2 id="history-title">
              Actualizaciones registradas en este navegador
            </h2>

          </div>

          <p id="empty-state" class="hu22-empty">
            Todavía no hay actualizaciones registradas.
          </p>

          <ul id="updates-list" class="hu22-list"></ul>

        </section>

      </div>

      ${renderStorySidebar({
        sidebarLabel: 'Información del seguimiento',
        petStatus: 'Seguimiento activo',
        petEmoji: '🐾',
        petTitle: 'Historias que continúan',
        petTag: 'HU22',
        petSubtitle: 'Registro de actualizaciones',
        asideDescription:
          'Conoce y registra los cambios importantes durante el proceso de adopción.',
        helpTitle: 'Registra una actualización',
        helpDescription:
          'Completa los datos necesarios para llevar un seguimiento adecuado.',
        helpSteps: [
          [
            'Selecciona el tipo',
            'Indica si corresponde a una mascota o adoptante.',
          ],
          [
            'Completa la información',
            'Ingresa el identificador, título y descripción.',
          ],
          [
            'Registra la actualización',
            'Guarda la información y consulta el historial.',
          ],
        ],
        helpLink: {
          href: './HU23.html',
          label: 'Consultar historial de actualizaciones',
        },
        asideNote:
          'Cada actualización nos ayuda a conocer mejor su historia.',
      })}

    </div>

  </main>

  <footer class="site-footer mx-auto flex items-center justify-between">

    <a class="brand footer-brand" href="./HU01.html">
      <span class="brand-mark" aria-hidden="true">🐾</span>
      <span>huellitas<span class="brand-dot">.</span></span>
    </a>

    <p>Con amor, cada historia encuentra su hogar.</p>

    <span>© 2026 Huellitas</span>

  </footer>
`

// Aca mostramos los errores correspondientes a cada campo.

function showErrors(errors) {

  const fields = {
    targetType: ['#target-type', '#target-type-error'],
    targetId: ['#target-id', '#target-id-error'],
    title: ['#title', '#title-error'],
    description: ['#description', '#description-error'],
  }

  for (const [field, [inputSelector, errorSelector]] of Object.entries(fields)) {

    const input = document.querySelector(inputSelector)
    const error = document.querySelector(errorSelector)

    if (!input || !error) continue

    input.setAttribute(
      'aria-invalid',
      String(Boolean(errors[field])),
    )

    error.textContent = errors[field] ?? ''
  }
}

// Aca convertimos la fecha a un formato mas facil de leer.

function formatDate(value) {

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('es-CO')
}

// Obtenemos las actualizaciones almacenadas y las
// mostramos en las tarjetas de la parte inferior.

function renderUpdates() {

  const list = document.querySelector('#updates-list')
  const emptyState = document.querySelector('#empty-state')

  const updates = getStoredUpdates(window.localStorage)

  list.replaceChildren()

  emptyState.hidden = updates.length > 0

  for (const update of updates) {

    const item = document.createElement('li')
    const heading = document.createElement('h3')
    const description = document.createElement('p')
    const type = document.createElement('span')
    const reference = document.createElement('p')
    const identifier = document.createElement('p')

    item.className = 'hu22-record'

    type.className = 'hu22-tag'

    type.textContent =
      update.targetType === 'mascota'
        ? 'Mascota'
        : 'Adoptante'

    heading.textContent = update.title

    description.textContent = update.description

    reference.textContent =
      `Relacionado con: ${update.targetId}`

    identifier.textContent =
      `ID: ${update.id} · Fecha: ${formatDate(update.createdAt)}`

    item.append(
      type,
      heading,
      description,
      reference,
      identifier,
    )

    list.append(item)
  }
}

// Inicializamos el formulario para validar y guardar
// la informacion que ingresa el usuario.

function initializeUpdatesPage() {

  const form = document.querySelector('#update-form')

  if (!form) return

  renderUpdates()

  form.addEventListener('submit', (event) => {

    event.preventDefault()

    const values = Object.fromEntries(
      new FormData(form).entries(),
    )

    const errors = validateUpdate(values)

    showErrors(errors)

    const feedback = document.querySelector('#form-feedback')

    const success = document.querySelector('#success-message')

    success.hidden = true

    feedback.textContent = ''

    if (Object.keys(errors).length > 0) {

      feedback.textContent = 'Revisa los campos marcados.'

      form.querySelector('[aria-invalid="true"]')?.focus()

      return
    }

    // Creamos la actualizacion y guardamos la informacion.

    const update = createUpdate(values)

    saveUpdate(update, window.localStorage)

    form.reset()

    showErrors({})

    renderUpdates()

    success.textContent =
      'La actualización se registró correctamente.'

    success.hidden = false
  })
}

// Aca controlamos la apertura y cierre del menu hamburguesa.

document.querySelector('.menu-toggle')
  .addEventListener('click', (event) => {

    const button = event.currentTarget

    const expanded =
      button.getAttribute('aria-expanded') === 'true'

    button.setAttribute(
      'aria-expanded',
      String(!expanded),
    )

    button.setAttribute(
      'aria-label',
      expanded ? 'Abrir navegación' : 'Cerrar navegación',
    )

    document.querySelector('.header-nav')
      .classList.toggle('nav-open', !expanded)
  })

initializeUpdatesPage()