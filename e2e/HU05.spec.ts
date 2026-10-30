import { expect, test } from '@playwright/test'

test('HU05 publishes, edits and deletes a success story', async ({ page }) => {
  await page.goto('/HU05.html')
  await page.getByLabel('Mascota').selectOption('mora')
  await page.getByLabel('Título').fill('Mora encontró su hogar')
  await page.getByLabel('Descripción').fill('Ahora disfruta de paseos con su familia.')
  await page.getByRole('button', { name: 'Publicar historia' }).click()
  await expect(page.getByRole('status')).toContainText('Historia publicada')
  await expect(page.locator('.story-record')).toContainText('Mora encontró su hogar')

  await page.locator('.story-record').getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Título').fill('La nueva vida de Mora')
  await page.getByRole('button', { name: 'Publicar historia' }).click()
  await expect(page.locator('.story-record')).toContainText('La nueva vida de Mora')

  await page.locator('.story-record').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByText('Aún no hay historias publicadas.')).toBeVisible()
})

test('HU05 rejects blank and inactive pet story submissions', async ({ page }) => {
  await page.goto('/HU05.html')
  await page.getByRole('button', { name: 'Publicar historia' }).click()
  await expect(page.getByRole('status')).toContainText('Selecciona una mascota')

  await page.evaluate(() => localStorage.setItem('huellitas.petRegistry', JSON.stringify([
    { petName: 'Mora', status: 'Inactiva' },
  ])))
  await page.getByLabel('Mascota').selectOption('mora')
  await page.getByLabel('Título').fill('Historia inválida')
  await page.getByLabel('Descripción').fill('No debe publicarse.')
  await page.getByRole('button', { name: 'Publicar historia' }).click()
  await expect(page.getByRole('status')).toContainText('Solo se pueden publicar historias de mascotas activas')
})

test('HU05 allows stories for adopted pets that are still active', async ({ page }) => {
  await page.goto('/HU05.html')
  await page.evaluate(() => localStorage.setItem('huellitas.formalizations', JSON.stringify([
    { petName: 'Mora', status: 'Formalizada' },
  ])))
  await page.getByLabel('Mascota').selectOption('mora')
  await page.getByLabel('Título').fill('Mora encontró hogar')
  await page.getByLabel('Descripción').fill('La mascota adoptada mantiene activo su registro.')
  await page.getByRole('button', { name: 'Publicar historia' }).click()
  await expect(page.getByRole('status')).toContainText('Historia publicada')
})
