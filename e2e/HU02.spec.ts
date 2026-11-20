import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test('manages photos through the backend and reflects them in HU01', async ({ page }) => {
  const api = await mockStoryApi(page)
  await page.goto('/HU02.html')
  await expect(page.locator('.photo-record')).toHaveCount(3)

  await page.getByLabel('URL de la fotografía').fill('https://images.test/mora-new.jpg')
  await page.getByLabel('Descripción (opcional)').fill('Mora en el jardín')
  await page.getByRole('button', { name: 'Guardar fotografía' }).click()
  await expect(page.getByRole('status')).toContainText('Fotografía guardada')
  await expect(page.locator('.photo-record')).toHaveCount(4)
  expect(api.photos[1]).toHaveLength(4)

  await page.locator('.photo-record').filter({ hasText: 'Mora en el jardín' }).getByRole('button', { name: 'Marcar principal' }).click()
  await page.locator('.photo-record').filter({ hasText: 'Mora en el jardín' }).getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Descripción (opcional)').fill('Retrato actualizado')
  await page.getByRole('button', { name: 'Guardar fotografía' }).click()
  await expect(page.locator('.photo-record').filter({ hasText: 'Retrato actualizado' })).toBeVisible()

  await page.locator('.photo-record').filter({ hasText: 'Retrato actualizado' }).getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('.photo-record')).toHaveCount(3)
})

test('validates photo URLs before sending a backend request', async ({ page }) => {
  await mockStoryApi(page)
  await page.goto('/HU02.html')
  await page.getByLabel('URL de la fotografía').fill('file:///private/image.jpg')
  await page.getByRole('button', { name: 'Guardar fotografía' }).click()
  await expect(page.locator('#photo-url-error')).toHaveText('Ingresa una URL válida para la fotografía.')
})
