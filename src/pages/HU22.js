import '../style.css'
import '../HU22.css'

import {
  validateUpdate,
  createUpdate,
  getStoredUpdates,
  saveUpdate,
} from '../workflows/HU22.js'

// Mostramos los errores de cada campo del formulario.
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

    if (!input || !error) {
      console.error(`No se encontró el campo: ${field}`)
      continue
    }

    input.setAttribute(
      'aria-invalid',
      String(Boolean(errors[field])),
    )

    error.textContent = errors[field] ?? ''
  }
}

// Aca cogemos las actualizaciones almacenadas y
// las mostramos en la parte del historial de la pagina.
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
    const reference = document.createElement('p')

    heading.textContent = update.title

    description.textContent = update.description

    reference.textContent =
      `${update.targetType}: ${update.targetId} · ${update.createdAt}`

    item.append(heading, description, reference)

    list.append(item)
  }
}

// Inicializamos la pagina y escuchamos cuando
// el usuario presiona el boton de registrar.
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

    // Si hay errores no dejamos registrar la informacion.
    if (Object.keys(errors).length > 0) {
      feedback.textContent = 'Revisa los campos marcados.'

      form.querySelector('[aria-invalid="true"]')?.focus()

      return
    }

    // Creamos y guardamos la actualizacion.
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

initializeUpdatesPage()