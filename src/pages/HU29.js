import {
  getPets,
  getMedicalEvents,
  filterMedicalEvents,
  getMedicalEventById,
} from '../workflows/HU29.js';

const $ = (selector) => document.querySelector(selector);

const petSelect = $('#pet');
const listElement = $('#events-list');
const feedbackElement = $('#feedback');
const diagnosisFilter = $('#diagnosis-filter');
const detailElement = $('#event-detail');

let pets = [];
let events = [];

function showFeedback(message, type = '') {
  feedbackElement.textContent = message;
  feedbackElement.className = type;
}

function getId(item) {
  return item?.id ?? item?.mascotaId ?? '';
}

function getPetName(pet) {
  return pet?.nombre || pet?.nombreMascota || `Mascota #${getId(pet)}`;
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
  pets.forEach((pet) => {
    const option = document.createElement('option');

    option.value = getId(pet);
    option.textContent = getPetName(pet);

    if (option.value !== '') {
      petSelect.appendChild(option);
    }
  });
}

function renderEvents(filteredEvents) {
  if (!filteredEvents.length) {
    listElement.innerHTML = `
      <tr>
        <td colspan="5">
          No hay eventos médicos disponibles para esta consulta.
        </td>
      </tr>
    `;
    return;
  }

  listElement.innerHTML = filteredEvents.map((event) => `
    <tr>
      <td>${escapeHtml(getId(event))}</td>
      <td>${escapeHtml(formatDate(event.fecha))}</td>
      <td>${escapeHtml(event.descripcion)}</td>
      <td>${escapeHtml(event.diagnostico)}</td>
      <td>${escapeHtml(event.tratamiento)}</td>
    </tr>
  `).join('');
}

function consultHistory() {
  const petId = petSelect.value;

  if (!petId) {
    listElement.innerHTML = `
      <tr>
        <td colspan="5">Seleccione una mascota para consultar su historial.</td>
      </tr>
    `;
    showFeedback('Debe seleccionar una mascota.', 'error');
    return;
  }

  const filteredEvents = filterMedicalEvents(
    events,
    petId,
    diagnosisFilter.value,
  );

  renderEvents(filteredEvents);

  if (!filteredEvents.length) {
    showFeedback(
      'No hay eventos médicos disponibles para esta consulta.',
      'error',
    );
  } else {
    showFeedback(
      `${filteredEvents.length} evento(s) médico(s) encontrado(s).`,
      'success',
    );
  }
}

async function searchEventById() {
  const id = $('#event-id').value;

  detailElement.innerHTML = '';

  try {
    const event = await getMedicalEventById(id);

    detailElement.innerHTML = `
      <h3>Evento médico encontrado</h3>
      <p><strong>ID:</strong> ${escapeHtml(getId(event))}</p>
      <p><strong>Fecha:</strong> ${escapeHtml(formatDate(event.fecha))}</p>
      <p><strong>Descripción:</strong> ${escapeHtml(event.descripcion)}</p>
      <p><strong>Diagnóstico:</strong> ${escapeHtml(event.diagnostico)}</p>
      <p><strong>Tratamiento:</strong> ${escapeHtml(event.tratamiento)}</p>
    `;

    showFeedback('Evento médico encontrado correctamente.', 'success');
  } catch (error) {
    detailElement.textContent = error.message;
    showFeedback(error.message, 'error');
  }
}

$('#search-button').addEventListener('click', consultHistory);

petSelect.addEventListener('change', () => {
  diagnosisFilter.value = '';
  consultHistory();
});

diagnosisFilter.addEventListener('input', () => {
  if (petSelect.value) {
    consultHistory();
  }
});

$('#clear-filter').addEventListener('click', () => {
  diagnosisFilter.value = '';
  consultHistory();
});

$('#search-event-button').addEventListener('click', searchEventById);

async function initialize() {
  try {
    pets = await getPets();
    fillPets();

    events = await getMedicalEvents();

    showFeedback('Información cargada correctamente.', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

initialize();