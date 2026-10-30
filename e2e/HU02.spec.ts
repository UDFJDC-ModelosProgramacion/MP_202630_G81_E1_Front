import { expect, test } from '@playwright/test'

test('HU02 adds, edits, marks principal and deletes a photo', async ({ page }) => {
  await page.goto('/HU02.html')
  await expect(page.locator('.photo-record')).toHaveCount(3)

  await page.getByLabel('URL de la fotografía').fill('https://images.test/mora-new.jpg')
  await page.getByLabel('Descripción (opcional)').fill('Mora en el jardín')
  await page.getByLabel('Marcar como fotografía principal').check()
  await page.getByRole('button', { name: 'Guardar fotografía' }).click()
  await expect(page.getByRole('status')).toContainText('Fotografía guardada')
  await expect(page.locator('.photo-record')).toHaveCount(4)
  await expect(page.locator('.photo-record').filter({ hasText: 'Mora en el jardín' }).getByText('Principal')).toBeVisible()
  await page.getByRole('link', { name: 'Abrir galería pública' }).click()
  await expect(page.locator('.gallery-photo')).toHaveCount(4)
  await expect(page.locator('.gallery-photo').first()).toContainText('Fotografía principal')
  await page.goto('/HU02.html')

  await page.locator('.photo-record').filter({ hasText: 'Mora en el jardín' }).getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Descripción (opcional)').fill('Retrato actualizado')
  await page.getByRole('button', { name: 'Guardar fotografía' }).click()
  await expect(page.locator('.photo-record').filter({ hasText: 'Retrato actualizado' })).toBeVisible()

  await page.locator('.photo-record').filter({ hasText: 'Retrato actualizado' }).getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('.photo-record')).toHaveCount(3)
})

test('HU02 rejects invalid URLs and unknown pet records', async ({ page }) => {
  await page.goto('/HU02.html')
  await page.getByLabel('URL de la fotografía').fill('file:///private/image.jpg')
  await page.getByRole('button', { name: 'Guardar fotografía' }).click()
  await expect(page.locator('#photo-url-error')).toHaveText('Ingresa una URL válida para la fotografía.')
})
