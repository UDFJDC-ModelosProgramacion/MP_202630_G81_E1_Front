import { expect, test } from '@playwright/test'
import { mockApi } from './helpers/api'

test('HU16 edits and deletes vaccination records', async ({ page }) => {
  let registros = [
    { id: 1, fechaAplicacion: '2026-01-10T05:00:00.000+00:00', proximaFecha: null, numeroLote: 'A', observacion: null, mascota: { id: 3 }, vacuna: { id: 2, nombre: 'Rabia' } },
    { id: 2, fechaAplicacion: '2026-08-10T05:00:00.000+00:00', proximaFecha: null, numeroLote: 'B', observacion: null, mascota: { id: 3 }, vacuna: { id: 5, nombre: 'Moquillo' } },
  ]
  await mockApi(page, {
    'GET /mascotas': [200, [{ id: 3, nombre: 'Luna' }]],
    'GET /registros-vacunacion': () => [200, registros],
    'PUT /registros-vacunacion/1': () => { registros[0] = { ...registros[0], numeroLote: 'Z' }; return [200, registros[0]] },
    'DELETE /registros-vacunacion/2': () => { registros = [registros[0]]; return [204, {}] },
  })
  await page.goto('/HU16.html')
  await page.getByLabel('Mascota').selectOption({ label: 'Luna' })
  await expect(page.locator('#edit-list li')).toHaveCount(2)

  await page.getByRole('button', { name: /Editar vacunación Rabia/ }).click()
  await page.getByLabel('Número de lote').fill('')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('#edit-numeroLote-error')).toHaveText('Ingresa el número de lote.')

  await page.getByLabel('Número de lote').fill('Z')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('#edit-feedback')).toHaveText('Registro actualizado correctamente.')

  await page.getByRole('button', { name: /Eliminar vacunación Moquillo/ }).click()
  await page.getByRole('button', { name: 'Sí, eliminar' }).click()
  await expect(page.locator('#edit-feedback')).toHaveText('Registro eliminado correctamente.')
  await expect(page.locator('#edit-list li')).toHaveCount(1)
})
