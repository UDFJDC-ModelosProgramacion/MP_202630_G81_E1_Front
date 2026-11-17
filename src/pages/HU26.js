import '../style.css'
import '../HU26.css'
import { renderStoryLinks } from '../story-navigation.js'
import { renderStorySidebar } from '../story-sidebar.js'
import {
  createNotification,
  fetchAdopters,
  fetchPets,
  getApiUrl,
  NotificationError,
} from '../workflows/HU26.js'

const app = document.querySelector('#app')
const apiUrl = getApiUrl()

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function showMessage(message, type = 'info') {
  const element = document.querySelector('#hu26-message')
  element.textContent = message
  element.className = `hu26-message is-visible is-${type}`
}

function clearMessage() {
  const element = document.querySelector('#hu26-message')
  element.textContent = ''
  element.className = 'hu26-message'
}

function renderOptions(items, placeholder) {
  return `<option value="">${escapeHtml(placeholder)}</option>${items.map((item) =>
    `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`,
  ).join('')}`
}


function renderPage() {
  app.innerHTML = `
    <header class="site-header mx-auto flex items-center justify-between">
      <a class="brand" href="./HU01.html" aria-label="Huellitas, inicio">
        <span class="brand-mark" aria-hidden="true">🐾</span>
        <span>huellitas<span class="brand-dot">.</span></span>
      </a>

      <nav
        class="header-nav"
        id="primary-navigation"
        aria-label="Navegación principal"
      >
        ${renderStoryLinks('HU26')}
      </nav>

      <button
        class="menu-toggle"
        type="button"
        aria-label="Abrir navegación"
        aria-controls="primary-navigation"
        aria-expanded="false"
      >
        <span></span><span></span>
      </button>
    </header>

    <main class="mx-auto w-full hu26-page">
      <div class="story-layout">
        <div class="story-primary">

          <header class="hu26-header">
            <div>
              <p class="eyebrow">
                <span class="eyebrow-dot"></span>
                HUELLITAS · ADMINISTRACIÓN
              </p>
              <h1 class="hu26-title">Generar notificaciones</h1>
              <p class="hu26-intro">
                Registra un aviso para informar sobre eventos importantes
                del proceso de adopción. Puedes dirigirlo a un adoptante
                o asociarlo únicamente con la mascota.
              </p>
            </div>
          </header>

          <nav class="breadcrumb" aria-label="Ruta de navegación">
            <a href="./HU01.html">Huellitas</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">HU26 · Generar notificaciones</span>
          </nav>

          <section class="hu26-card" aria-labelledby="hu26-form-title">
            <p class="hu26-eyebrow">CREACIÓN DE AVISOS</p>
            <h2 id="hu26-form-title">Nueva notificación</h2>
            <p class="hu26-card-description">
              Los campos marcados con * son obligatorios.
              La mascota debe existir en el sistema.
            </p>

            <div
              id="hu26-message"
              class="hu26-message"
              role="status"
              aria-live="polite"
            ></div>

            <form id="hu26-form" class="hu26-form" novalidate>
              <div class="hu26-fields">

                <div class="hu26-field">
                  <label for="hu26-tipo">
                    Tipo de notificación
                    <span class="hu26-required">*</span>
                  </label>
                  <input
                    id="hu26-tipo"
                    name="tipo"
                    maxlength="80"
                    placeholder="Ej. Recordatorio de cita"
                    required
                  />
                  <small class="hu26-error" data-error="tipo"></small>
                </div>

                <div class="hu26-field">
                  <label for="hu26-canal">
                    Canal <span class="hu26-required">*</span>
                  </label>
                  <select id="hu26-canal" name="canal" required>
                    <option value="">Selecciona un canal</option>
                    <option value="EMAIL">Correo electrónico</option>
                    <option value="SMS">SMS</option>
                    <option value="PUSH">Notificación push</option>
                  </select>
                  <small class="hu26-error" data-error="canal"></small>
                </div>

                <div class="hu26-field hu26-field-full">
                  <label for="hu26-mensaje">
                    Mensaje <span class="hu26-required">*</span>
                  </label>
                  <textarea
                    id="hu26-mensaje"
                    name="mensaje"
                    maxlength="1000"
                    placeholder="Escribe la información que recibirá el destinatario..."
                    required
                  ></textarea>
                  <small class="hu26-error" data-error="mensaje"></small>
                </div>

                <div class="hu26-field">
                  <label for="hu26-fecha">
                    Fecha <span class="hu26-required">*</span>
                  </label>
                  <input
                    id="hu26-fecha"
                    name="fecha"
                    type="date"
                    required
                  />
                  <small class="hu26-error" data-error="fecha"></small>
                </div>

                <div class="hu26-field">
                  <label for="hu26-mascota">
                    Mascota <span class="hu26-required">*</span>
                  </label>
                  <select
                    id="hu26-mascota"
                    name="mascotaId"
                    required
                    disabled
                  >
                    <option value="">Cargando mascotas...</option>
                  </select>
                  <small class="hu26-error" data-error="mascotaId"></small>
                </div>

                <div class="hu26-field hu26-field-full">
                  <label for="hu26-adoptante">
                    Adoptante (opcional)
                  </label>
                  <select
                    id="hu26-adoptante"
                    name="adoptanteId"
                    disabled
                  >
                    <option value="">Sin adoptante asociado</option>
                  </select>
                  <small class="hu26-hint">
                    Si seleccionas un adoptante, debe estar registrado
                    en el sistema.
                  </small>
                  <small class="hu26-error" data-error="adoptanteId"></small>
                </div>
              </div>

              <div class="hu26-actions">
                <button
                  id="hu26-submit"
                  class="hu26-button"
                  type="submit"
                >
                  Registrar notificación
                </button>

                <button
                  id="hu26-reset"
                  class="hu26-button hu26-button-secondary"
                  type="reset"
                >
                  Limpiar formulario
                </button>
              </div>
            </form>
          </section>

          <section class="hu26-card hu26-channels">
            <p class="hu26-eyebrow">MEDIOS DE COMUNICACIÓN</p>
            <h2>Canales disponibles</h2>
            <p class="hu26-card-description">
              Elige cómo se debe comunicar el aviso.
            </p>

            <div class="hu26-side-list">
              <div class="hu26-side-item">
                <div class="hu26-side-icon">✉️</div>
                <div>
                  <strong>Correo electrónico</strong>
                  <span>Canal EMAIL para enviar información por correo.</span>
                </div>
              </div>

              <div class="hu26-side-item">
                <div class="hu26-side-icon">💬</div>
                <div>
                  <strong>Mensaje SMS</strong>
                  <span>Canal SMS para avisos mediante mensaje de texto.</span>
                </div>
              </div>

              <div class="hu26-side-item">
                <div class="hu26-side-icon">🔔</div>
                <div>
                  <strong>Notificación push</strong>
                  <span>Canal PUSH para avisos dentro de una aplicación.</span>
                </div>
              </div>
            </div>

            <p class="hu26-hint hu26-channel-note">
              La notificación se registra en el backend.
              Esta pantalla no simula el envío real por correo,
              SMS o push.
            </p>
          </section>
        </div>

        ${renderStorySidebar({
          sidebarLabel: 'Información sobre notificaciones',
          petStatus: 'En adopción',
          petEmoji: '🐶',
          petTitle: 'Siempre conectados',
          petTag: 'HU26',
          petSubtitle: 'Avisos de adopción',
          asideDescription: 'Mantén informada a la comunidad sobre novedades importantes relacionadas con las mascotas.',
          helpTitle: 'Genera una notificación',
          helpDescription: 'Registra avisos relacionados con las mascotas y sus procesos de adopción.',
          helpSteps: [
            ['Selecciona el canal', 'Escoge correo, SMS o notificación push.'],
            ['Escribe el mensaje', 'Indica la información que quieres comunicar.'],
            ['Registra el aviso', 'Selecciona la mascota y guarda la notificación.'],
          ],
          helpLink: {
            href: './HU01.html',
            label: 'Explorar mascotas',
          },
          asideNote: 'Mantener informadas a las familias también es parte del cuidado.',
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

  const menuToggle = document.querySelector('.menu-toggle')

  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true'

    menuToggle.setAttribute('aria-expanded', String(!expanded))
    menuToggle.setAttribute(
      'aria-label',
      expanded ? 'Abrir navegación' : 'Cerrar navegación',
    )

    document.querySelector('.header-nav')
      .classList.toggle('nav-open', !expanded)
  })
}


function formValues(form) {
  const data = new FormData(form)
  return {
    tipo: String(data.get('tipo') ?? ''),
    mensaje: String(data.get('mensaje') ?? ''),
    fecha: String(data.get('fecha') ?? ''),
    canal: String(data.get('canal') ?? ''),
    mascotaId: String(data.get('mascotaId') ?? ''),
    adoptanteId: String(data.get('adoptanteId') ?? ''),
  }
}

function showFieldErrors(errors) {
  document.querySelectorAll('[data-error]').forEach((element) => {
    element.textContent = errors[element.dataset.error] ?? ''
  })
}

async function loadRelatedData() {
  const petSelect = document.querySelector('#hu26-mascota')
  const adopterSelect = document.querySelector('#hu26-adoptante')
  try {
    const [pets, adopters] = await Promise.all([
      fetchPets(fetch, apiUrl),
      fetchAdopters(fetch, apiUrl),
    ])
    petSelect.innerHTML = renderOptions(pets, 'Selecciona una mascota')
    adopterSelect.innerHTML = renderOptions(adopters, 'Sin adoptante asociado')
    petSelect.disabled = false
    adopterSelect.disabled = false
    if (!pets.length) {
      petSelect.innerHTML = '<option value="">No hay mascotas registradas</option>'
      showMessage('No hay mascotas registradas. Registra una mascota antes de crear una notificación.', 'info')
    }
  } catch (error) {
    petSelect.innerHTML = '<option value="">No se pudieron cargar las mascotas</option>'
    adopterSelect.innerHTML = '<option value="">No se pudieron cargar los adoptantes</option>'
    showMessage(error.message, 'error')
  }
}

renderPage()
const form = document.querySelector('#hu26-form')
const submitButton = document.querySelector('#hu26-submit')

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  clearMessage()
  const values = formValues(form)
  const errors = {}
  if (!values.tipo.trim()) errors.tipo = 'Escribe el tipo de notificación.'
  if (!values.mensaje.trim()) errors.mensaje = 'Escribe el mensaje de la notificación.'
  if (!values.fecha || Number.isNaN(Date.parse(`${values.fecha}T00:00:00`))) errors.fecha = 'Selecciona una fecha válida.'
  if (!values.canal) errors.canal = 'Selecciona un canal.'
  if (!values.mascotaId) errors.mascotaId = 'Selecciona una mascota.'
  showFieldErrors(errors)
  if (Object.keys(errors).length) {
    showMessage('Revisa los campos obligatorios.', 'error')
    return
  }

  submitButton.disabled = true
  submitButton.textContent = 'Registrando...'
  try {
    const created = await createNotification(fetch, values, apiUrl)
    form.reset()
    showFieldErrors({})
    showMessage(`Notificación registrada correctamente${created?.id ? ` (ID ${created.id})` : ''}.`, 'success')
  } catch (error) {
    const message = error instanceof NotificationError
      ? error.message
      : 'Ocurrió un error inesperado al registrar la notificación.'
    showMessage(message, 'error')
  } finally {
    submitButton.disabled = false
    submitButton.textContent = 'Registrar notificación'
  }
})

form.addEventListener('reset', () => {
  showFieldErrors({})
  clearMessage()
})

loadRelatedData()
