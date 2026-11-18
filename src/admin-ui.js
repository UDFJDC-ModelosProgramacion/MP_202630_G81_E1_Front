// Utilidades de interfaz compartidas por las páginas de administración que usan formularios.
import { escapeHtml } from './catalog/catalog.js'

export function fieldMarkup(prefix, field) {
  const id = `${prefix}-${field.name}`
  const star = field.required ? ' <span aria-hidden="true">*</span>' : ''
  const described = `aria-describedby="${id}-error"`
  let control

  if (field.type === 'textarea') {
    control = `<textarea id="${id}" name="${field.name}" rows="3" ${described}></textarea>`
  } else if (field.type === 'select') {
    const options = field.options
      .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
      .join('')
    control = `<select id="${id}" name="${field.name}" ${described}><option value="">Selecciona…</option>${options}</select>`
  } else {
    const extra = field.type === 'number' ? ' min="0" inputmode="numeric"' : ''
    control = `<input id="${id}" name="${field.name}" type="${field.type ?? 'text'}"${extra} ${described}>`
  }

  return `<div class="field"><label for="${id}">${escapeHtml(field.label)}${star}</label>${control}<small class="field-error" id="${id}-error"></small></div>`
}

export const formMarkup = (prefix, fields) => fields.map((field) => fieldMarkup(prefix, field)).join('')

export function readValues(root, prefix, fields) {
  return Object.fromEntries(fields.map(({ name }) => [name, root.querySelector(`#${prefix}-${name}`).value]))
}

export function fillValues(root, prefix, fields, values) {
  for (const { name } of fields) root.querySelector(`#${prefix}-${name}`).value = values[name] ?? ''
}

export function paintErrors(root, prefix, fields, errors) {
  for (const { name } of fields) {
    const message = errors[name] ?? ''
    root.querySelector(`#${prefix}-${name}-error`).textContent = message
    root.querySelector(`#${prefix}-${name}`).setAttribute('aria-invalid', String(Boolean(message)))
  }
  const first = fields.find(({ name }) => errors[name])
  if (first) root.querySelector(`#${prefix}-${first.name}`).focus()
}

export function setText(element, message) {
  element.textContent = message
}

export function showAlert(banner, message) {
  banner.textContent = message
  banner.hidden = false
}

export function clearAlert(banner) {
  banner.textContent = ''
  banner.hidden = true
}
