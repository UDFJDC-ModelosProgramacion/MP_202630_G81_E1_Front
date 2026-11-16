import { mountWorkflowPage } from '../workflow-page.js'
import {
  createReturn,
  saveReturn,
  validateReturn,
} from '../workflows/HU21.js'

mountWorkflowPage({
  storyId: 'HU21',
  storyTitle: 'Registrar la devolución de una mascota',
  eyebrow: 'CUIDAR TAMBIÉN ES RECIBIR',
  title: 'Un regreso seguro también merece cuidado.',
  description: 'Documenta la devolución, conserva el historial y registra la disponibilidad actual de la mascota.',
  formLabel: 'REGISTRO DE DEVOLUCIÓN',
  formTitle: 'Registremos su regreso',
  formDescription: 'Indica el motivo y la situación para mantener actualizado su historial.',
  submitLabel: 'Registrar devolución',
  formMarkup: `
    <fieldset class="form-section">
      <legend><span class="section-number">01</span><span>Adopción que finaliza</span></legend>
      <p class="section-help">Identifica a la mascota y a la persona adoptante.</p>
      <div class="form-grid grid grid-cols-2 gap-4">
        <div class="field">
          <label for="petName">Nombre de la mascota <span aria-hidden="true">*</span></label>
          <input id="petName" name="petName" placeholder="Ej. Mora" required>
          <small class="field-error" id="petName-error"></small>
        </div>
        <div class="field">
          <label for="adopterName">Nombre del adoptante <span aria-hidden="true">*</span></label>
          <input id="adopterName" name="adopterName" autocomplete="name" placeholder="Nombre completo" required>
          <small class="field-error" id="adopterName-error"></small>
        </div>
        <div class="field field-full">
          <label for="returnDate">Fecha de devolución <span aria-hidden="true">*</span></label>
          <input id="returnDate" name="returnDate" type="date" required>
          <small class="field-error" id="returnDate-error"></small>
        </div>
      </div>
    </fieldset>
    <fieldset class="form-section">
      <legend><span class="section-number">02</span><span>Motivo y disponibilidad</span></legend>
      <p class="section-help">Registra la situación y el estado de la mascota al regresar.</p>
      <div class="form-grid grid grid-cols-2 gap-4">
        <div class="field field-full">
          <label for="reason">Motivo de la devolución <span aria-hidden="true">*</span></label>
          <select id="reason" name="reason" required>
            <option value="">Selecciona un motivo</option>
            <option value="Incompatibilidad con el adoptante">Incompatibilidad con el adoptante</option>
            <option value="Situación de salud de la mascota">Situación de salud de la mascota</option>
            <option value="Cambio en las circunstancias del adoptante">Cambio en las circunstancias del adoptante</option>
            <option value="Otro motivo">Otro motivo</option>
          </select>
          <small class="field-error" id="reason-error"></small>
        </div>
        <div class="field field-full">
          <label for="description">Descripción de la situación <span aria-hidden="true">*</span></label>
          <textarea id="description" name="description" rows="4" maxlength="1000" placeholder="Describe lo ocurrido y cualquier detalle relevante para su cuidado..." required></textarea>
          <small class="field-error" id="description-error"></small>
        </div>
        <div class="field field-full">
          <span class="field-label">¿Puede volver a estar disponible para adopción? <span aria-hidden="true">*</span></span>
          <div class="choice-row">
            <label class="choice-card">
              <input type="radio" name="compatibleReAdoption" value="si" required>
              <span class="choice-icon" aria-hidden="true">♡</span>
              <span><strong>Sí, puede volver a estar disponible</strong><small>La mascota puede iniciar un nuevo proceso de adopción</small></span>
            </label>
            <label class="choice-card">
              <input type="radio" name="compatibleReAdoption" value="no">
              <span class="choice-icon" aria-hidden="true">⌕</span>
              <span><strong>No, requiere evaluación</strong><small>Su disponibilidad queda pendiente de revisión</small></span>
            </label>
          </div>
          <small class="field-error" id="compatibleReAdoption-error"></small>
        </div>
      </div>
    </fieldset>
  `,
  successEyebrow: 'DEVOLUCIÓN REGISTRADA',
  successTitle: 'Su historial quedó actualizado',
  successDescription: 'La devolución fue añadida al historial y la disponibilidad de la mascota se actualizó.',
  summaryFields: [
    ['Mascota', 'petName'],
    ['Motivo', 'reason'],
    ['Disponibilidad', 'availability'],
    ['Fecha', 'returnDate'],
  ],
  validate: validateReturn,
  create: createReturn,
  save: saveReturn,
  petStatus: 'Historial protegido',
  petEmoji: '🐕',
  petTitle: 'Regreso al refugio',
  petTag: 'HU21',
  petSubtitle: 'Registro de devolución',
  asideDescription: 'Cada retorno se documenta para conservar la historia de adopciones y dar continuidad al cuidado.',
  helpTitle: 'El historial continúa',
  helpDescription: 'La mascota quedará disponible para adopción o en evaluación, según la condición registrada.',
  asideNote: 'El bienestar de la mascota guía cada decisión.',
})
