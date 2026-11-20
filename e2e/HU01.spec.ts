import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test('loads pets and gallery photos from the backend', async ({ page }) => {
  await mockStoryApi(page)
  await page.goto('/HU01.html#galeria/1')

  const photos = page.locator('.gallery-photo')
  await expect(photos).toHaveCount(3)
  await expect(photos.first()).toHaveClass(/gallery-photo-main/)
  await expect(page.getByRole('navigation', { name: 'Galerías de mascotas' })).toContainText('Luna')
})

test('shows empty and not-found gallery states using backend data', async ({ page }) => {
  await mockStoryApi(page, { photos: { 1: [], 2: [] } })
  await page.goto('/HU01.html#galeria/2')
  await expect(page.getByRole('heading', { name: 'Aún no hay fotografías disponibles' })).toBeVisible()

  await page.goto('/HU01.html#galeria/999')
  await expect(page.locator('.gallery-message[role="alert"]'))
    .toContainText('No encontramos a esta mascota')
})
