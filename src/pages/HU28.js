import {
  getMedicalEvents,
  getPets,
  createMedicalEvent,
  updateMedicalEvent,
} from '../workflows/HU28.js';

const $ = (selector) => document.querySelector(selector);

const listElement = $('#events-list');
const feedbackElement = $('#feedback');
const editPanel = $('#edit-panel');

let events = [];
let pets = [];

function showFeedback(message, type = '') {
  feedbackElement.textContent = message;
  feedbackElement.className = type;
}

function getId(item) {
  return item?.id ?? item?.mascotaId ?? '';
}

function getPetName(pet) {
  if (!pet) return 'Sin mascota';

  return pet.nombre || pet.nombreMascota ||
    `Mascota #${getId(pet)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]);
}

function formatDate(value) {
  if (!value) return '';

  const date = String(value).substring(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function fillPets() {
  const select = $('#pet');

  pets.forEach((pet) => {
    const option = document.createElement('option');
    option.value = getId(pet);
    option.textContent = getPetName(pet);

    if (option.value !== '') {
      select.appendChild(option);
    }
  });
}

function renderEvents() {
  if (!events.length) {
    listElement.innerHTML = `
      <tr>
        <td colspan="7">No hay eventos médicos registrados.</td>
      </tr>
    `;
    return;
  }

  listElement.innerHTML = events.map((event) => {
    const id = getId(event);

    return `
      <tr>
        <td>${escapeHtml(id)}</td>
        <td>${escapeHtml(getPetName(event.mascota))}</td>
        <td>${escapeHtml(formatDate(event.fecha))}</td>
        <td>${escapeHtml(event.descripcion)}</td>
        <td>${escapeHtml(event.diagnostico)}</td>
        <td>${escapeHtml(event.tratamiento)}</td>
        <td>
          <button
            type="button"
            class="small edit-button"
            data-id="${escapeHtml(id)}"
          >
            Editar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadEvents() {
  showFeedback('Cargando eventos médicos...');

  try {
    events = await getMedicalEvents();
    renderEvents();
    showFeedback('Eventos médicos cargados correctamente.', 'success');
  } catch (error) {
    listElement.innerHTML = `
      <tr>
        <td colspan="7">No fue posible cargar los eventos médicos.</td>
      </tr>
    `;
    showFeedback(error.message, 'error');
  }
}

function openEditForm(id) {
  const event = events.find(
    (item) => String(getId(item)) === String(id),
  );

  if (!event) {
    showFeedback('El evento médico solicitado no fue encontrado.', 'error');
    return;
  }

  $('#edit-id').value = id;
  $('#edit-description').value = event.descripcion || '';
  $('#edit-diagnosis').value = event.diagnostico || '';
  $('#edit-treatment').value = event.tratamiento || '';

  editPanel.hidden = false;
  editPanel.scrollIntoView({ behavior: 'smooth' });
  showFeedback('');
}

function closeEditForm() {
  $('#edit-form').reset();
  $('#edit-id').value = '';
  editPanel.hidden = true;
}

$('#event-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const values = {
    mascotaId: $('#pet').value,
    fecha: $('#date').value,
    descripcion: $('#description').value,
    diagnostico: $('#diagnosis').value,
    tratamiento: $('#treatment').value,
  };

  try {
    await createMedicalEvent(values);

    $('#event-form').reset();

    await loadEvents();

    showFeedback('Evento médico registrado correctamente.', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
});

listElement.addEventListener('click', (event) => {
  const button = event.target.closest('.edit-button');

  if (button) {
    openEditForm(button.dataset.id);
  }
});

$('#edit-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = $('#edit-id').value;

  const originalEvent = events.find(
    (item) => String(getId(item)) === String(id),
  );

  if (!originalEvent) {
    showFeedback('El evento médico solicitado no fue encontrado.', 'error');
    return;
  }

  const values = {
    descripcion: $('#edit-description').value,
    diagnostico: $('#edit-diagnosis').value,
    tratamiento: $('#edit-treatment').value,
  };

  try {
    await updateMedicalEvent(id, values, originalEvent);

    closeEditForm();
    await loadEvents();

    showFeedback('Evento médico actualizado correctamente.', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
});

$('#cancel-edit').addEventListener('click', closeEditForm);
$('#reload-button').addEventListener('click', loadEvents);

async function initialize() {
  try {
    pets = await getPets();
    fillPets();
  } catch (error) {
    showFeedback(`No fue posible cargar las mascotas: ${error.message}`, 'error');
  }

  await loadEvents();
}

initialize();