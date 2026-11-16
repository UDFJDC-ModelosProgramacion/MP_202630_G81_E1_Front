import { expect, test } from '@playwright/test'
import { mockApi } from './helpers/api'

test('HU12 shows the catalog and the detail of a vaccine', async ({ page }) => {
  await mockApi(page, {
    'GET /vacunas': [200, [{ id: 1, nombre: 'Rabia', descripcion: 'Refuerzo anual' }, { id: 2, nombre: 'Moquillo', descripcion: '' }]],
    'GET /vacunas/1': [200, { id: 1, nombre: 'Rabia', descripcion: 'Refuerzo anual' }],
  })
  await page.goto('/HU12.html')
  await expect(page.locator('#vacunas-list li')).toHaveCount(2)

  await page.getByRole('button', { name: 'Ver detalle de Rabia' }).click()
  await expect(page.locator('#vacuna-detail')).toContainText('Refuerzo anual')
  await expect(page.getByRole('button', { name: /Editar|Eliminar/ })).toHaveCount(0)
})

test('HU12 shows the error of the API', async ({ page }) => {
  await mockApi(page, {})
  await page.goto('/HU12.html')
  await expect(page.locator('#vacunas-feedback')).toContainText('Sin ruta')
})
