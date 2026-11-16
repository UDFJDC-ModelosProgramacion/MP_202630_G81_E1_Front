import { expect, test } from '@playwright/test'

const pets = [
  { id: 2, nombre: 'Mora', especie: 'Perro' },
]
const adopters = [
  { id: 7, nombre: 'Ana', apellidos: 'Pérez' },
]

async function mockCatalogues(page) {
  await page.route('**/api/mascotas', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(pets),
  }))
  await page.route('**/api/adoptantes', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(adopters),
  }))
}

test('loads pets and optional adopters in the notification form', async ({ page }) => {
  await mockCatalogues(page)
  await page.goto('/HU26.html')
  await expect(page.getByLabel(/Mascota/)).toContainText('Mora')
  await expect(page.getByLabel(/Adoptante/)).toContainText('Ana Pérez')
})

test('creates a notification without an adopter', async ({ page }) => {
  await mockCatalogues(page)
  let sentBody
  await page.route('**/api/notificaciones', async (route) => {
    sentBody = route.request().postDataJSON()
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 31, ...sentBody }),
    })
  })

  await page.goto('/HU26.html')
  await page.getByLabel(/Tipo de notificación/).fill('Recordatorio de cita')
  await page.getByLabel(/Canal/).selectOption('SMS')
  await page.getByLabel(/Mensaje/).fill('La cita de Mora está programada.')
  await page.getByLabel(/Fecha/).fill('2026-11-10')
  await page.getByLabel(/Mascota/).selectOption('2')
  await page.getByRole('button', { name: 'Registrar notificación' }).click()

  await expect(page.getByRole('status')).toContainText('registrada correctamente')
  expect(sentBody.mascota).toEqual({ id: 2 })
  expect(sentBody.adoptante).toBeNull()
  expect(sentBody.canal).toBe('SMS')
})

test('shows an error when the backend rejects the notification', async ({ page }) => {
  await mockCatalogues(page)
  await page.route('**/api/notificaciones', (route) => route.fulfill({
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'La mascota asociada a la notificación no existe' }),
  }))

  await page.goto('/HU26.html')
  await page.getByLabel(/Tipo de notificación/).fill('Aviso')
  await page.getByLabel(/Canal/).selectOption('EMAIL')
  await page.getByLabel(/Mensaje/).fill('Mensaje de prueba')
  await page.getByLabel(/Fecha/).fill('2026-11-10')
  await page.getByLabel(/Mascota/).selectOption('2')
  await page.getByRole('button', { name: 'Registrar notificación' }).click()

  await expect(page.getByRole('status')).toContainText('La mascota asociada')
})

test('validates required fields before sending', async ({ page }) => {
  await mockCatalogues(page)
  let requestSent = false
  await page.route('**/api/notificaciones', (route) => {
    requestSent = true
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/HU26.html')
  await page.getByRole('button', { name: 'Registrar notificación' }).click()
  await expect(page.getByRole('status')).toContainText('Revisa los campos')
  expect(requestSent).toBe(false)
})
