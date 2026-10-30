
export const STORAGE_KEY = 'huellitas.actualizaciones'

export function validateUpdate(values) {
  const errors = {}
  const value = (field) =>
    typeof values[field] === 'string' ? values[field].trim() : ''

  if (!['mascota', 'adoptante'].includes(value('targetType'))) {
    errors.targetType = 'Selecciona una mascota o un adoptante.'
  }

  if (!value('targetId')) {
    errors.targetId = 'Escribe el identificador correspondiente.'
  }

  if (!value('title')) {
    errors.title = 'Escribe el título de la actualización.'
  }

  if (!value('description')) {
    errors.description = 'Escribe la descripción de la actualización.'
  }

  return errors
}

export function createUpdate(
  values,
  {
    id = globalThis.crypto.randomUUID(),
    createdAt = new Date().toISOString(),
  } = {},
) {
  return {
    id,
    createdAt,
    targetType: values.targetType.trim(),
    targetId: values.targetId.trim(),
    title: values.title.trim(),
    description: values.description.trim(),
  }
}

export function getStoredUpdates(storage) {
  const stored = storage.getItem(STORAGE_KEY)

  if (stored === null) return []

  const updates = JSON.parse(stored)

  if (!Array.isArray(updates)) {
    throw new TypeError('Las actualizaciones guardadas deben ser una lista.')
  }

  return updates
}

export function saveUpdate(update, storage) {
  const updates = getStoredUpdates(storage)
  updates.push(update)
  storage.setItem(STORAGE_KEY, JSON.stringify(updates))
}


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
      console.error(`No se encontró el campo o mensaje de error: ${field}`)
      continue
    }

    input.setAttribute('aria-invalid', String(Boolean(errors[field])))
    error.textContent = errors[field] ?? ''
  }
}


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

function initializeUpdatesPage() {
  const form = document.querySelector('#update-form')

  if (!form) return

  renderUpdates()

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const values = Object.fromEntries(new FormData(form).entries())
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

    const update = createUpdate(values)
    saveUpdate(update, window.localStorage)

    form.reset()
    showErrors({})
    renderUpdates()

    success.textContent = 'La actualización se registró correctamente.'
    success.hidden = false
  })
}

if (typeof document !== 'undefined') {
  initializeUpdatesPage()
}
