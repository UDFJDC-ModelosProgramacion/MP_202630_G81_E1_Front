import {
  getNotifications,
  getPets,
  getAdopters,
  filterNotifications,
  updateNotification,
  deleteNotification,
} from '../workflows/HU27.js';

const $ = (selector) => document.querySelector(selector);

const listElement = $('#notifications-list');
const feedbackElement = $('#feedback');
const editPanel = $('#edit-panel');

let notifications = [];

function showFeedback(message, type = '') {
  feedbackElement.textContent = message;
  feedbackElement.className = type;
}

function getId(item) {
  return item?.id ?? item?.mascotaId ?? item?.adoptanteId ?? '';
}

function getPetName(pet) {
  if (!pet) return 'Sin mascota';

  return pet.nombre || pet.nombreMascota ||
    `Mascota #${getId(pet)}`;
}

function getAdopterName(adopter) {
  if (!adopter) return 'Sin adoptante';

  const fullName = [
    adopter.nombre,
    adopter.apellidos,
  ].filter(Boolean).join(' ');

  return fullName ||
    adopter.nombreCompleto ||
    `Adoptante #${getId(adopter)}`;
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

function renderNotifications(items) {
  if (!items.length) {
    listElement.innerHTML = `
      <tr>
        <td colspan="8">No se encontraron notificaciones.</td>
      </tr>
    `;
    return;
  }

  listElement.innerHTML = items.map((notification) => {
    const id = getId(notification);

    return `
      <tr>
        <td>${escapeHtml(id)}</td>
        <td>${escapeHtml(notification.tipo)}</td>
        <td>${escapeHtml(notification.mensaje)}</td>
        <td>${escapeHtml(formatDate(notification.fecha))}</td>
        <td>${escapeHtml(notification.canal)}</td>
        <td>${escapeHtml(getPetName(notification.mascota))}</td>
        <td>${escapeHtml(getAdopterName(notification.adoptante))}</td>
        <td>
          <button
            type="button"
            class="small edit-button"
            data-id="${escapeHtml(id)}"
          >
            Editar
          </button>

          <button
            type="button"
            class="small danger delete-button"
            data-id="${escapeHtml(id)}"
          >
            Eliminar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function fillSelect(selector, items, getLabel) {
  const select = $(selector);
  const firstOption = select.options[0].outerHTML;

  select.innerHTML = firstOption;

  items.forEach((item) => {
    const id = getId(item);

    if (id === '') return;

    const option = document.createElement('option');
    option.value = id;
    option.textContent = getLabel(item);

    select.appendChild(option);
  });
}

async function loadFilters() {
  const [pets, adopters] = await Promise.all([
    getPets(),
    getAdopters(),
  ]);

  fillSelect('#filter-pet', pets, getPetName);
  fillSelect('#filter-adopter', adopters, getAdopterName);
}

async function loadNotifications() {
  showFeedback('Cargando notificaciones...');

  try {
    notifications = await getNotifications();
    applyFilters();
    showFeedback('Notificaciones cargadas correctamente.', 'success');
  } catch (error) {
    listElement.innerHTML = `
      <tr>
        <td colspan="8">No fue posible cargar las notificaciones.</td>
      </tr>
    `;
    showFeedback(error.message, 'error');
  }
}

function applyFilters() {
  const filters = {
    canal: $('#filter-channel').value,
    mascotaId: $('#filter-pet').value,
    adoptanteId: $('#filter-adopter').value,
  };

  const filtered = filterNotifications(notifications, filters);
  renderNotifications(filtered);
}

function openEditForm(id) {
  const notification = notifications.find(
    (item) => String(getId(item)) === String(id),
  );

  if (!notification) {
    showFeedback('La notificación solicitada no fue encontrada.', 'error');
    return;
  }

  $('#edit-id').value = id;
  $('#edit-type').value = notification.tipo || '';
  $('#edit-message').value = notification.mensaje || '';
  $('#edit-date').value = formatDate(notification.fecha);
  $('#edit-channel').value = notification.canal || '';

  editPanel.hidden = false;
  editPanel.scrollIntoView({ behavior: 'smooth' });
  showFeedback('');
}

function closeEditForm() {
  $('#edit-form').reset();
  $('#edit-id').value = '';
  editPanel.hidden = true;
}

listElement.addEventListener('click', async (event) => {
  const editButton = event.target.closest('.edit-button');
  const deleteButton = event.target.closest('.delete-button');

  if (editButton) {
    openEditForm(editButton.dataset.id);
    return;
  }

  if (deleteButton) {
    const id = deleteButton.dataset.id;

    const confirmed = window.confirm(
      `¿Está seguro de eliminar la notificación ${id}?`,
    );

    if (!confirmed) return;

    try {
      await deleteNotification(id);

      notifications = notifications.filter(
        (item) => String(getId(item)) !== String(id),
      );

      applyFilters();
      showFeedback('Notificación eliminada correctamente.', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  }
});

$('#edit-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = $('#edit-id').value;
  const originalNotification = notifications.find(
    (item) => String(getId(item)) === String(id),
  );

  if (!originalNotification) {
    showFeedback('La notificación solicitada no fue encontrada.', 'error');
    return;
  }

  const values = {
    tipo: $('#edit-type').value,
    mensaje: $('#edit-message').value,
    fecha: $('#edit-date').value,
    canal: $('#edit-channel').value,
  };

  try {
    await updateNotification(id, values, originalNotification);

    closeEditForm();
    await loadNotifications();

    showFeedback('Notificación actualizada correctamente.', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
});

$('#filter-button').addEventListener('click', applyFilters);

$('#clear-filters').addEventListener('click', () => {
  $('#filter-channel').value = '';
  $('#filter-pet').value = '';
  $('#filter-adopter').value = '';

  applyFilters();
});

$('#reload-button').addEventListener('click', loadNotifications);
$('#cancel-edit').addEventListener('click', closeEditForm);

async function initialize() {
  try {
    await loadFilters();
  } catch (error) {
    showFeedback(
      `No fue posible cargar los filtros: ${error.message}`,
      'error',
    );
  }

  await loadNotifications();
}

initialize();