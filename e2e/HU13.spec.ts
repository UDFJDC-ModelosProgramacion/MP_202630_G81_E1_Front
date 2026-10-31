import { expect, test } from '@playwright/test'
import { mockApi } from './helpers/api'

test('HU13 creates, edits and deletes a vaccine', async ({ page }) => {
  let vacunas = [{ id: 1, nombre: 'Rabia', descripcion: '' }]
  await mockApi(page, {
    'GET /vacunas': () => [200, vacunas],
    'POST /vacunas': () => { vacunas = [...vacunas, { id: 2, nombre: 'Moquillo', descripcion: '' }]; return [201, vacunas[1]] },
    'PUT /vacunas/2': () => { vacunas = [vacunas[0], { id: 2, nombre: 'Moquillo triple', descripcion: '' }]; return [200, vacunas[1]] },
    'DELETE /vacunas/2': () => { vacunas = [vacunas[0]]; return [204, {}] },
  })
  await page.goto('/HU13.html')
  await page.getByRole('button', { name: /Crear vacuna/ }).click()
  await expect(page.locator('#vacuna-nombre-error')).toHaveText('Ingresa el nombre de la vacuna.')

  await page.getByLabel('Nombre').fill('Moquillo')
  await page.getByRole('button', { name: /Crear vacuna/ }).click()
  await expect(page.locator('#vacuna-feedback')).toHaveText('Vacuna creada correctamente.')
  await expect(page.locator('#vacunas-list li')).toHaveCount(2)

  await page.getByRole('button', { name: 'Editar Moquillo' }).click()
  await page.getByLabel('Nombre').fill('Moquillo triple')
  await page.getByRole('button', { name: /Guardar cambios/ }).click()
  await expect(page.locator('#vacuna-feedback')).toHaveText('Vacuna actualizada correctamente.')

  await page.getByRole('button', { name: 'Eliminar Moquillo triple' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('¿Eliminar la vacuna Moquillo triple?')
  await page.getByRole('button', { name: 'Sí, eliminar' }).click()
  await expect(page.locator('#vacuna-feedback')).toHaveText('Vacuna eliminada correctamente.')
  await expect(page.locator('#vacunas-list li')).toHaveCount(1)
})
