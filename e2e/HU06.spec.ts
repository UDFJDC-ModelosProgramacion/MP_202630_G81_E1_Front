import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test('displays public stories, empty and inactive states from the backend', async ({ page }) => {
  await mockStoryApi(page, {
    stories: {
      1: [{
        id: 21, mascotaId: 1, mascota: { id: 1, nombre: 'Mora' }, titulo: 'Mora ya tiene hogar',
        descripcion: 'Una familia la recibió con cariño.', fecha: '2026-03-10',
      }],
      2: [],
    },
  })
  await page.goto('/HU06.html')
  await expect(page.locator('.story-record')).toContainText('Mora ya tiene hogar')
  await expect(page.locator('.story-record')).toContainText('2026-03-10')

  await page.getByLabel('Mascota').selectOption('2')
  await expect(page.getByRole('status')).toContainText('aún no tiene historias')
})

test('shows an inactive pet message based on backend status', async ({ page }) => {
  await mockStoryApi(page, {
    pets: [
      { id: 1, nombre: 'Mora', especie: 'Perro', raza: 'Criolla', edad: 2, estado: 'Inactivo', refugio: { ciudad: 'Bogotá' } },
      { id: 2, nombre: 'Luna', especie: 'Gato', raza: 'Criolla', edad: 1, estado: 'Disponible', refugio: { ciudad: 'Bogotá' } },
    ],
  })
  await page.goto('/HU06.html')
  await page.getByLabel('Mascota').selectOption('1')
  await expect(page.getByRole('status')).toContainText('mascota está inactiva')
})
