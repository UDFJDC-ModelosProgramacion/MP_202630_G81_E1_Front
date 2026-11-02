import { test, expect } from '@playwright/test';

const pets = [
  { id: 10, nombre: 'Mora' },
  { id: 20, nombre: 'Luna' },
  { id: 30, nombre: 'Toby' },
];

const events = [
  {
    id: 1,
    fecha: '2026-10-01',
    descripcion: 'Consulta general',
    diagnostico: 'Gripe',
    tratamiento: 'Medicamento',
    mascota: { id: 10 },
  },
  {
    id: 2,
    fecha: '2026-10-02',
    descripcion: 'Revisión',
    diagnostico: 'Infección',
    tratamiento: 'Antibiótico',
    mascota: { id: 10 },
  },
  {
    id: 3,
    fecha: '2026-10-03',
    descripcion: 'Vacunación',
    diagnostico: 'Sano',
    tratamiento: 'Vacuna',
    mascota: { id: 20 },
  },
];

async function mockApi(page) {
  await page.route('**/api/mascotas', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pets),
    });
  });

  await page.route('**/api/eventos-medicos', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(events),
    });
  });

  
  await page.route('**/api/eventos-medicos/*', async (route) => {
    const url = new URL(route.request().url());
    const id = Number(url.pathname.split('/').pop());

    const event = events.find((item) => item.id === id);

    if (!event) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'No encontrado',
        }),
      });

      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(event),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto('/HU29.html');
});

test('debe mostrar las mascotas disponibles', async ({ page }) => {
  
  await expect(page.locator('#pet option')).toHaveCount(4);

  await expect(page.locator('#pet')).toContainText('Mora');
  await expect(page.locator('#pet')).toContainText('Luna');
  await expect(page.locator('#pet')).toContainText('Toby');
});

test('debe consultar el historial de una mascota', async ({ page }) => {
  await page.locator('#pet').selectOption('10');

  await expect(page.locator('#events-list')).toContainText('Gripe');
  await expect(page.locator('#events-list')).toContainText('Infección');
  await expect(page.locator('#events-list')).not.toContainText('Sano');
});

test('debe filtrar los eventos por diagnóstico', async ({ page }) => {
  await page.locator('#pet').selectOption('10');
  await page.locator('#diagnosis-filter').fill('gripe');

  await expect(page.locator('#events-list')).toContainText('Gripe');
  await expect(page.locator('#events-list')).not.toContainText('Infección');
});

test('debe informar cuando una mascota no tiene eventos médicos', async ({ page }) => {
  await page.locator('#pet').selectOption('30');

  await expect(page.locator('#events-list')).toContainText(
    'No hay eventos médicos disponibles para esta consulta.',
  );
});

test('debe informar cuando el filtro no encuentra resultados', async ({ page }) => {
  await page.locator('#pet').selectOption('10');
  await page.locator('#diagnosis-filter').fill('fractura');

  await expect(page.locator('#events-list')).toContainText(
    'No hay eventos médicos disponibles para esta consulta.',
  );
});

test('debe consultar un evento médico por ID', async ({ page }) => {
  await page.locator('#event-id').fill('1');
  await page.locator('#search-event-button').click();

  await expect(page.locator('#event-detail')).toContainText(
    'Evento médico encontrado',
  );
  await expect(page.locator('#event-detail')).toContainText('Gripe');
});

test('debe mostrar error cuando el evento no existe', async ({ page }) => {
  await page.route('**/api/eventos-medicos/999', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'No encontrado' }),
    });
  });

  await page.locator('#event-id').fill('999');
  await page.locator('#search-event-button').click();

  await expect(page.locator('#event-detail')).toContainText(
    'El evento médico solicitado no fue encontrado.',
  );
});

test('debe limpiar el filtro de diagnóstico', async ({ page }) => {
  await page.locator('#pet').selectOption('10');
  await page.locator('#diagnosis-filter').fill('gripe');

  await page.locator('#clear-filter').click();

  await expect(page.locator('#diagnosis-filter')).toHaveValue('');
  await expect(page.locator('#events-list')).toContainText('Infección');
});