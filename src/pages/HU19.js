import { mountWorkflowPage } from '../workflow-page.js'
import {
  createFormalization,
  saveFormalization,
  validateFormalization,
} from '../workflows/HU19.js'

mountWorkflowPage({
  storyId: 'HU19',
  storyTitle: 'Formalizar una adopción',
  eyebrow: 'UN HOGAR PARA SIEMPRE',
  title: 'Una nueva familia, un compromiso para toda la vida.',
  description: 'Registra la adopción y asigna al veterinario que acompañará el bienestar de la mascota.',
  formLabel: 'FORMALIZACIÓN',
  formTitle: 'Datos de la adopción',
  formDescription: 'Completa la información y asigna un responsable para el seguimiento.',
  submitLabel: 'Formalizar adopción',
  formMarkup: `
    <fieldset class="form-section">
      <legend><span class="section-number">01</span><span>Adopción</span></legend>
      <p class="section-help">Relaciona a la persona adoptante con la mascota.</p>
      <div class="form-grid grid grid-cols-2 gap-4">
        <div class="field">
          <label for="adopterName">Nombre del adoptante <span aria-hidden="true">*</span></label>
          <input id="adopterName" name="adopterName" autocomplete="name" placeholder="Nombre completo" required>
          <small class="field-error" id="adopterName-error"></small>
        </div>
        <div class="field">
          <label for="petName">Nombre de la mascota <span aria-hidden="true">*</span></label>
          <input id="petName" name="petName" placeholder="Ej. Mora" required>
          <small class="field-error" id="petName-error"></small>
        </div>
        <div class="field field-full">
          <label for="adoptionDate">Fecha de adopción <span aria-hidden="true">*</span></label>
          <input id="adoptionDate" name="adoptionDate" type="date" required>
          <small class="field-error" id="adoptionDate-error"></small>
        </div>
      </div>
    </fieldset>
    <fieldset class="form-section">
      <legend><span class="section-number">02</span><span>Seguimiento veterinario</span></legend>
      <p class="section-help">Asigna un profesional y programa la próxima cita de seguimiento.</p>
      <div class="form-grid grid grid-cols-2 gap-4">
        <div class="field field-full">
          <label for="veterinarian">Veterinario responsable <span aria-hidden="true">*</span></label>
          <select id="veterinarian" name="veterinarian" required>
            <option value="">Selecciona un veterinario</option>
            <option value="Dra. Valentina Ríos">Dra. Valentina Ríos</option>
            <option value="Dr. Andrés León">Dr. Andrés León</option>
          </select>
          <small class="field-error" id="veterinarian-error"></small>
          <small class="field-hint">Equipo veterinario de ejemplo del Refugio Huellitas.</small>
        </div>
        <div class="field field-full">
          <label for="nextAppointment">Próxima cita de seguimiento <span aria-hidden="true">*</span></label>
          <input id="nextAppointment" name="nextAppointment" type="date" required>
          <small class="field-error" id="nextAppointment-error"></small>
        </div>
        <div class="field field-full">
          <label for="observation">Observaciones <span class="optional-label">(opcional)</span></label>
          <textarea id="observation" name="observation" rows="3" maxlength="500" placeholder="Notas para el seguimiento veterinario..."></textarea>
        </div>
      </div>
    </fieldset>
  `,
  successEyebrow: 'ADOPCIÓN REGISTRADA',
  successTitle: '¡Una historia comienza!',
  successDescription: 'La adopción quedó formalizada y el seguimiento veterinario fue asignado.',
  summaryFields: [
    ['Adoptante', 'adopterName'],
    ['Mascota', 'petName'],
    ['Veterinario', 'veterinarian'],
    ['Próxima cita', 'nextAppointment'],
  ],
  validate: validateFormalization,
  create: createFormalization,
  save: saveFormalization,
  petStatus: 'Adopción formalizada',
  petEmoji: '🐕',
  petTitle: 'Seguimiento responsable',
  petTag: 'HU19',
  petSubtitle: 'Adopción · Bienestar animal',
  asideDescription: 'Al formalizar la adopción, un veterinario queda asignado para acompañar la salud y adaptación de la mascota.',
  helpTitle: 'Después de formalizar',
  helpDescription: 'El veterinario responsable podrá realizar controles periódicos y dar continuidad al cuidado de la mascota.',
  asideNote: 'Cada adopción continúa con cuidado y acompañamiento.',
})
