import { expect, test } from '@playwright/test'
import { mockApi } from './helpers/api'

const registros = [
  { id: 1, fechaAplicacion: '2026-01-10T05:00:00.000+00:00', proximaFecha: '2027-01-10T05:00:00.000+00:00', numeroLote: 'A', mascota: { id: 3 }, vacuna: { id: 2, nombre: 'Rabia' } },
  { id: 2, fechaAplicacion: '2026-08-10T05:00:00.000+00:00', proximaFecha: null, numeroLote: 'B', mascota: { id: 3 }, vacuna: { id: 5, nombre: 'Moquillo' } },
]

test('HU15 shows the history of a pet, newest first', async ({ page }) => {
  await mockApi(page, {
    'GET /mascotas': [200, [{ id: 3, nombre: 'Luna' }, { id: 4, nombre: 'Rocky' }]],
    'GET /registros-vacunacion': [200, registros],
  })
  await page.goto('/HU15.html')
  await page.getByLabel('Mascota').selectOption({ label: 'Luna' })

  await expect(page.locator('#history-list li')).toHaveCount(2)
  await expect(page.locator('#history-list li').first()).toContainText('Moquillo')
  await expect(page.locator('#history-list li').nth(1)).toContainText('Próxima: 2027-01-10')
})

test('HU15 explains when a pet has no vaccines', async ({ page }) => {
  await mockApi(page, {
    'GET /mascotas': [200, [{ id: 4, nombre: 'Rocky' }]],
    'GET /registros-vacunacion': [200, registros],
  })
  await page.goto('/HU15.html')
  await page.getByLabel('Mascota').selectOption({ label: 'Rocky' })
  await expect(page.locator('#history-feedback')).toHaveText('Esta mascota aún no tiene vacunas registradas.')
})
