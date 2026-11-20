import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test('publishes, edits and deletes success stories through the backend', async ({ page }) => {
  const api = await mockStoryApi(page)
  await page.goto('/HU05.html')
  await page.getByLabel('Mascota').selectOption('1')
  await page.getByLabel('Título').fill('Mora encontró su hogar')
  await page.getByLabel('Descripción').fill('Ahora disfruta de paseos con su familia.')
  await page.getByRole('button', { name: 'Publicar historia' }).click()
  await expect(page.getByRole('status')).toContainText('Historia publicada')
  await expect(page.locator('.story-record')).toContainText('Mora encontró su hogar')
  expect(api.stories[1]).toHaveLength(1)

  await page.locator('.story-record').getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Título').fill('La nueva vida de Mora')
  await page.getByRole('button', { name: 'Publicar historia' }).click()
  await expect(page.locator('.story-record')).toContainText('La nueva vida de Mora')

  await page.locator('.story-record').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByText('Aún no hay historias publicadas.')).toBeVisible()
  expect(api.stories[1]).toHaveLength(0)
})

test('only allows stories for active pets', async ({ page }) => {
  await mockStoryApi(page, {
    pets: [
      { id: 1, nombre: 'Mora', especie: 'Perro', raza: 'Criolla', edad: 2, estado: 'Inactivo', refugio: { ciudad: 'Bogotá' } },
      { id: 2, nombre: 'Luna', especie: 'Gato', raza: 'Criolla', edad: 1, estado: 'Disponible', refugio: { ciudad: 'Bogotá' } },
    ],
  })
  await page.goto('/HU05.html')
  await expect(page.getByRole('option', { name: 'Mora (Inactiva)' })).toBeDisabled()
  await page.getByLabel('Título').fill('Historia inválida')
  await page.getByLabel('Descripción').fill('No debe publicarse.')
  await page.getByRole('button', { name: 'Publicar historia' }).click()
  await expect(page.getByRole('status')).toContainText('Selecciona una mascota')
})
