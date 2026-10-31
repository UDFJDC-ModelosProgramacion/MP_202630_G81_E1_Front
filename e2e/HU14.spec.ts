import { expect, test } from '@playwright/test'
import { mockApi } from './helpers/api'

test('HU14 validates and registers a vaccination', async ({ page }) => {
  await mockApi(page, {
    'GET /mascotas': [200, [{ id: 3, nombre: 'Luna' }]],
    'GET /vacunas': [200, [{ id: 2, nombre: 'Rabia' }]],
    'POST /registros-vacunacion': [201, { id: 8 }],
  })
  await page.goto('/HU14.html')
  await expect(page.locator('#vaccination-mascotaId option')).toHaveCount(2)
  await page.getByRole('button', { name: /Registrar vacunación/ }).click()
  await expect(page.locator('#vaccination-mascotaId-error')).toHaveText('Selecciona una mascota.')
  await expect(page.locator('#vaccination-numeroLote-error')).toHaveText('Ingresa el número de lote.')

  await page.getByLabel('Mascota').selectOption({ label: 'Luna' })
  await page.getByLabel('Vacuna', { exact: true }).selectOption({ label: 'Rabia' })
  await page.getByLabel('Fecha de aplicación').fill('2026-10-01')
  await page.getByLabel('Número de lote').fill('L-2045')
  await page.getByRole('button', { name: /Registrar vacunación/ }).click()

  await expect(page.locator('#vaccination-feedback')).toContainText('Vacunación registrada correctamente')
})

test('HU14 shows the message of the API when it rejects the registration', async ({ page }) => {
  await mockApi(page, {
    'GET /mascotas': [200, [{ id: 3, nombre: 'Luna' }]],
    'GET /vacunas': [200, [{ id: 2, nombre: 'Rabia' }]],
    'POST /registros-vacunacion': [412, { apierror: { message: 'El número de lote es obligatorio' } }],
  })
  await page.goto('/HU14.html')
  await page.getByLabel('Mascota').selectOption({ label: 'Luna' })
  await page.getByLabel('Vacuna', { exact: true }).selectOption({ label: 'Rabia' })
  await page.getByLabel('Fecha de aplicación').fill('2026-10-01')
  await page.getByLabel('Número de lote').fill('L-1')
  await page.getByRole('button', { name: /Registrar vacunación/ }).click()

  await expect(page.locator('#vaccination-feedback')).toHaveText('El número de lote es obligatorio')
})
