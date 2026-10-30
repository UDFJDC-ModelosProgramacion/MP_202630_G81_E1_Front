import './style.css'
import { renderStoryLinks } from './story-navigation.js'
import { renderStorySidebar } from './story-sidebar.js'

export function mountWorkflowPage(config) {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <header class="site-header mx-auto flex items-center justify-between">
      <a class="brand" href="./HU18.html" aria-label="Huellitas, inicio">
        <span class="brand-mark" aria-hidden="true">🐾</span>
        <span>huellitas<span class="brand-dot">.</span></span>
      </a>
      <nav class="header-nav" id="primary-navigation" aria-label="Navegación principal">
        ${renderStoryLinks(config.storyId)}
      </nav>
      <button class="menu-toggle" type="button" aria-label="Abrir navegación" aria-controls="primary-navigation" aria-expanded="false">
        <span></span><span></span>
      </button>
    </header>
    <main class="mx-auto w-full">
      <section class="page-intro">
        <div class="intro-copy">
          <p class="eyebrow"><span class="eyebrow-dot"></span> ${config.eyebrow}</p>
          <h1>${config.title}</h1>
          <p class="intro-text">${config.description}</p>
        </div>
        <div class="intro-decoration" aria-hidden="true">
          <span class="sun-shape"></span><span class="intro-paw">🐾</span>
          <span class="intro-sparkle sparkle-one">✳</span><span class="intro-sparkle sparkle-two">✳</span>
        </div>
      </section>
      <div class="breadcrumb" aria-label="Ruta de navegación">
        <a href="./HU18.html">Huellitas</a><span aria-hidden="true">/</span>
        <span aria-current="page">${config.storyId} · ${config.storyTitle}</span>
      </div>
      <section class="application-layout grid items-start">
        <div class="application-main">
          <div class="form-heading">
            <div>
              <p class="step-label">${config.storyId} · ${config.formLabel}</p>
              <h2>${config.formTitle}</h2>
              <p>${config.formDescription}</p>
            </div>
          </div>
          <div id="form-error" class="form-error-banner" role="alert" hidden>
            Revisa los campos marcados antes de continuar.
          </div>
          <form id="workflow-form" novalidate>
            ${config.formMarkup}
            <p class="privacy-note"><span aria-hidden="true">♧</span> La información se guarda para mantener el registro del refugio.</p>
            <button class="submit-button" type="submit">${config.submitLabel} <span aria-hidden="true">→</span></button>
            <p class="required-note"><span aria-hidden="true">*</span> Campos obligatorios</p>
          </form>
          <section id="success-view" class="success-view" aria-live="polite" tabindex="-1" hidden>
            <div class="success-icon" aria-hidden="true">✓</div>
            <p class="eyebrow">${config.successEyebrow}</p>
            <h2>${config.successTitle}</h2>
            <p>${config.successDescription}</p>
            <div class="success-reference">Registro <strong id="record-reference"></strong></div>
            <ul id="workflow-summary" class="workflow-summary"></ul>
            <button id="new-record" class="secondary-button" type="button">Registrar otro</button>
          </section>
        </div>
        ${renderStorySidebar(config)}
      </section>
    </main>
    <footer class="site-footer mx-auto flex items-center justify-between">
      <a class="brand footer-brand" href="./HU18.html"><span class="brand-mark" aria-hidden="true">🐾</span><span>huellitas<span class="brand-dot">.</span></span></a>
      <p>Con amor, cada historia encuentra su hogar.</p>
      <span>© 2026 Huellitas</span>
    </footer>
  `

  const form = document.querySelector('#workflow-form')
  const formError = document.querySelector('#form-error')
  const successView = document.querySelector('#success-view')

  function clearErrors() {
    for (const error of form.querySelectorAll('.field-error')) error.textContent = ''
    for (const field of form.elements) field.removeAttribute('aria-invalid')
  }

  form.addEventListener('input', clearChangedField)
  form.addEventListener('change', clearChangedField)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    clearErrors()
    const values = Object.fromEntries(new FormData(form).entries())
    const errors = config.validate(values)
    const errorFields = Object.keys(errors)

    if (errorFields.length > 0) {
      formError.hidden = false
      for (const name of errorFields) {
        const fields = Array.from(form.elements).filter((field) => field.name === name)
        for (const field of fields) field.setAttribute('aria-invalid', 'true')
        const message = form.querySelector(`#${name}-error`)
        if (message) message.textContent = errors[name]
      }
      const firstInvalid = Array.from(form.elements).find((field) => field.name === errorFields[0])
      firstInvalid?.focus()
      return
    }

    formError.hidden = true
    const record = config.create(values)
    config.save(window.localStorage, record)
    document.querySelector('#record-reference').textContent = record.id
    const summary = document.querySelector('#workflow-summary')
    summary.replaceChildren()
    for (const [label, property] of config.summaryFields) {
      const item = document.createElement('li')
      item.textContent = `${label}: ${record[property]}`
      summary.append(item)
    }
    form.hidden = true
    successView.hidden = false
    successView.focus()
  })

  document.querySelector('#new-record').addEventListener('click', () => {
    form.reset()
    clearErrors()
    formError.hidden = true
    successView.hidden = true
    form.hidden = false
    form.querySelector('input, select, textarea')?.focus()
  })

  const menuToggle = document.querySelector('.menu-toggle')
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
    menuToggle.setAttribute('aria-expanded', String(!expanded))
    menuToggle.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación')
    document.querySelector('.header-nav').classList.toggle('nav-open', !expanded)
  })

  function clearChangedField(event) {
    const field = event.target
    if (!field.name) return
    const matchingFields = Array.from(form.elements).filter((item) => item.name === field.name)
    for (const matchingField of matchingFields) matchingField.removeAttribute('aria-invalid')
    const message = form.querySelector(`#${field.name}-error`)
    if (message) message.textContent = ''
  }

  return { form }
}
