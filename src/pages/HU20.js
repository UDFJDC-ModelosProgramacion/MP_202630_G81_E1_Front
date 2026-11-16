import { mountWorkflowPage } from '../workflow-page.js'
import {
  createTrial,
  saveTrial,
  validateTrial,
} from '../workflows/HU20.js'

mountWorkflowPage({
  storyId: 'HU20',
  storyTitle: 'Gestionar pruebas de convivencia',
  eyebrow: 'UN TIEMPO PARA CONOCERSE',
  title: 'La mejor conexión también se construye día a día.',
  description: 'Programa un periodo de convivencia para que la mascota y su futuro hogar puedan adaptarse.',
  formLabel: 'PRUEBA DE CONVIVENCIA',
  formTitle: 'Planifiquemos su tiempo juntos',
  formDescription: 'Registra quién participa y define las fechas del periodo de prueba.',
  submitLabel: 'Programar prueba',
  formMarkup: `
    <fieldset class="form-section">
      <legend><span class="section-number">01</span><span>Participantes</span></legend>
      <p class="section-help">Identifica a la persona adoptante y a la mascota.</p>
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
      </div>
    </fieldset>
    <fieldset class="form-section">
      <legend><span class="section-number">02</span><span>Periodo de convivencia</span></legend>
      <p class="section-help">Indica cuándo empieza y cuántos días durará la prueba.</p>
      <div class="form-grid grid grid-cols-2 gap-4">
        <div class="field">
          <label for="startDate">Fecha de inicio <span aria-hidden="true">*</span></label>
          <input id="startDate" name="startDate" type="date" required>
          <small class="field-error" id="startDate-error"></small>
        </div>
        <div class="field">
          <label for="durationDays">Duración en días <span aria-hidden="true">*</span></label>
          <input id="durationDays" name="durationDays" type="number" min="1" step="1" placeholder="Ej. 7" required>
          <small class="field-error" id="durationDays-error"></small>
        </div>
        <div class="field field-full">
          <label for="observation">Acuerdos u observaciones <span class="optional-label">(opcional)</span></label>
          <textarea id="observation" name="observation" rows="3" maxlength="500" placeholder="Anota detalles importantes para acompañar la adaptación..."></textarea>
        </div>
      </div>
    </fieldset>
  `,
  successEyebrow: 'PRUEBA PROGRAMADA',
  successTitle: '¡Comienza el tiempo de conocerse!',
  successDescription: 'El periodo quedó registrado para acompañar la adaptación mutua.',
  summaryFields: [
    ['Adoptante', 'adopterName'],
    ['Mascota', 'petName'],
    ['Inicio', 'startDate'],
    ['Fin', 'endDate'],
    ['Duración', 'durationDays'],
  ],
  validate: validateTrial,
  create: createTrial,
  save: saveTrial,
  petStatus: 'Prueba programada',
  petEmoji: '🐈',
  petTitle: 'Adaptación mutua',
  petTag: 'HU20',
  petSubtitle: 'Prueba de convivencia',
  asideDescription: 'El periodo de prueba permite observar cómo se siente la mascota en su nuevo entorno y cómo se adapta la familia.',
  helpTitle: 'Un periodo acompañado',
  helpDescription: 'Al finalizar, el adoptante y el refugio podrán valorar cómo fue la adaptación antes de continuar con la adopción definitiva.',
  asideNote: 'Cada mascota tiene su propio ritmo para adaptarse.',
})
