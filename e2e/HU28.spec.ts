import { test, expect } from '@playwright/test';

const medicalEvents = [
  {
    id: 1,
    fecha: '2026-10-20',
    descripcion: 'Revisión general',
    diagnostico: 'Gripe',
    tratamiento: 'Medicamento',
    mascota: { id: 10, nombre: 'Luna' },
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

  await page.route('**/api/eventos-medicos', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: medicalEvents });
      return;
    }

    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        json: { id: 2 },
      });
      return;
    }

    await route.continue();
  });

  await page.goto('/HU28.html');
});

test('muestra los eventos médicos registrados', async ({ page }) => {
  await expect(page.getByText('Revisión general')).toBeVisible();
  await expect(page.getByText('Gripe')).toBeVisible();
});

test('carga las mascotas en el selector', async ({ page }) => {
  await expect(page.locator('#pet option')).toContainText([
    'Seleccione una mascota',
    'Luna',
    'Max',
  ]);
});

test('permite registrar un evento médico', async ({ page }) => {
  let requestReceived = false;

  await page.route('**/api/eventos-medicos', async (route) => {
    if (route.request().method() === 'POST') {
      requestReceived = true;

      await route.fulfill({
        status: 201,
        json: { id: 2 },
      });
      return;
    }

    await route.continue();
  });

  await page.locator('#pet').selectOption('10');
  await page.locator('#date').fill('2026-10-25');
  await page.locator('#description').fill('Consulta veterinaria');
  await page.locator('#diagnosis').fill('Infección leve');
  await page.locator('#treatment').fill('Tratamiento médico');

  await page.getByRole('button', {
    name: 'Registrar evento',
  }).click();

  await expect.poll(() => requestReceived).toBe(true);
  await expect(
    page.getByText('Evento médico registrado correctamente.'),
  ).toBeVisible();
});

test('no permite registrar un diagnóstico vacío', async ({ page }) => {
  await page.locator('#pet').selectOption('10');
  await page.locator('#date').fill('2026-10-25');
  await page.locator('#description').fill('Consulta veterinaria');
  await page.locator('#diagnosis').fill('');
  await page.locator('#treatment').fill('Tratamiento médico');

  await page.getByRole('button', {
    name: 'Registrar evento',
  }).click();

  await expect(page.locator('#diagnosis')).toHaveJSProperty(
    'validity.valueMissing',
    true,
  );
});

test('permite abrir el formulario de edición', async ({ page }) => {
  await page.locator('.edit-button[data-id="1"]').click();

  await expect(page.locator('#edit-panel')).toBeVisible();
  await expect(page.locator('#edit-diagnosis')).toHaveValue('Gripe');
});

test('permite actualizar un evento médico', async ({ page }) => {
  let updateReceived = false;

  await page.route('**/api/eventos-medicos/1', async (route) => {
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

  await page.locator('#edit-description').fill('Consulta actualizada');
  await page.locator('#edit-diagnosis').fill('Diagnóstico actualizado');
  await page.locator('#edit-treatment').fill('Nuevo tratamiento');

  await page.getByRole('button', {
    name: 'Guardar cambios',
  }).click();

  await expect.poll(() => updateReceived).toBe(true);

  await expect(
    page.getByText('Evento médico actualizado correctamente.'),
  ).toBeVisible();
});

test('no permite editar con diagnóstico vacío', async ({ page }) => {
  await page.locator('.edit-button[data-id="1"]').click();

  await page.locator('#edit-diagnosis').fill('');

  await page.getByRole('button', {
    name: 'Guardar cambios',
  }).click();

  await expect(page.locator('#feedback')).toContainText(
    'El diagnóstico es obligatorio.',
  );
});