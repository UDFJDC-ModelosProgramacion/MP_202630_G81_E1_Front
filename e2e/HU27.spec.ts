import { test, expect } from '@playwright/test';

const notifications = [
  {
    id: 1,
    tipo: 'Recordatorio',
    mensaje: 'Recordatorio de adopción',
    fecha: '2026-10-20',
    canal: 'EMAIL',
    mascota: { id: 10, nombre: 'Luna' },
    adoptante: { id: 100, nombre: 'Carlos' },
  },
  {
    id: 2,
    tipo: 'Aviso',
    mensaje: 'Aviso de seguimiento',
    fecha: '2026-10-21',
    canal: 'SMS',
    mascota: { id: 20, nombre: 'Max' },
    adoptante: { id: 200, nombre: 'Laura' },
  },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/mascotas', async (route) => {
    await route.fulfill({
      json: [
        { id: 10, nombre: 'Luna' },
        { id: 20, nombre: 'Max' },
      ],
    });
  });

  await page.route('**/api/adoptantes', async (route) => {
    await route.fulfill({
      json: [
        { id: 100, nombre: 'Carlos' },
        { id: 200, nombre: 'Laura' },
      ],
    });
  });

  await page.route('**/api/notificaciones', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: notifications });
      return;
    }

    await route.continue();
  });

  await page.goto('/HU27.html');
});

test('muestra las notificaciones registradas', async ({ page }) => {
  await expect(page.getByText('Recordatorio de adopción')).toBeVisible();
  await expect(page.getByText('Aviso de seguimiento')).toBeVisible();
});

test('filtra las notificaciones por canal', async ({ page }) => {
  await page.locator('#filter-channel').selectOption('EMAIL');
  await page.locator('#filter-button').click();

  await expect(page.getByText('Recordatorio de adopción')).toBeVisible();
  await expect(page.getByText('Aviso de seguimiento')).toHaveCount(0);
});

test('filtra las notificaciones por mascota', async ({ page }) => {
  await page.locator('#filter-pet').selectOption('10');
  await page.locator('#filter-button').click();

  await expect(page.getByText('Recordatorio de adopción')).toBeVisible();
  await expect(page.getByText('Aviso de seguimiento')).toHaveCount(0);
});

test('permite limpiar los filtros', async ({ page }) => {
  await page.locator('#filter-channel').selectOption('EMAIL');
  await page.locator('#filter-button').click();
  await page.locator('#clear-filters').click();

  await expect(page.getByText('Recordatorio de adopción')).toBeVisible();
  await expect(page.getByText('Aviso de seguimiento')).toBeVisible();
});

test('permite abrir el formulario de edición', async ({ page }) => {
  await page.locator('.edit-button[data-id="1"]').click();

  await expect(page.locator('#edit-panel')).toBeVisible();
  await expect(page.locator('#edit-type')).toHaveValue('Recordatorio');
});

test('permite actualizar una notificación', async ({ page }) => {
  let updateReceived = false;

  await page.route('**/api/notificaciones/1', async (route) => {
    if (route.request().method() === 'PUT') {
      updateReceived = true;

      await route.fulfill({
        status: 200,
        json: { id: 1 },
      });
      return;
    }

    await route.continue();
  });

  await page.locator('.edit-button[data-id="1"]').click();
  await page.locator('#edit-type').fill('Recordatorio actualizado');
  await page.locator('#edit-message').fill('Mensaje actualizado');
  await page.locator('#edit-date').fill('2026-10-25');
  await page.locator('#edit-channel').selectOption('SMS');

  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect.poll(() => updateReceived).toBe(true);
  await expect(page.getByText('Notificación actualizada correctamente.')).toBeVisible();
});

test('permite eliminar una notificación', async ({ page }) => {
  let deleteReceived = false;

  page.on('dialog', (dialog) => dialog.accept());

  await page.route('**/api/notificaciones/1', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteReceived = true;
      await route.fulfill({ status: 204 });
      return;
    }

    await route.continue();
  });

  await page.locator('.delete-button[data-id="1"]').click();

  await expect.poll(() => deleteReceived).toBe(true);
  await expect(page.getByText('Notificación eliminada correctamente.')).toBeVisible();
});