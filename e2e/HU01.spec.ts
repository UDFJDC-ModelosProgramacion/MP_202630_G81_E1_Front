import { expect, test } from '@playwright/test'

test('shows every photo and marks the main photo first', async ({ page }) => {
  await page.goto('/HU01.html#galeria/mora')

  const photos = page.locator('.gallery-photo')
  await expect(photos).toHaveCount(3)
  await expect(photos.first()).toHaveClass(/gallery-photo-main/)
  await expect(photos.first()).toContainText('Fotografía principal')
  await expect(page.getByRole('navigation', { name: 'Galerías de mascotas' })).toContainText('Luna')
  await expect(page.getByRole('complementary', { name: 'Información de la galería' })).toBeVisible()
})

test('shows an informative empty state when the pet has no photos', async ({ page }) => {
  await page.goto('/HU01.html#galeria/luna')
  await expect(page.getByRole('heading', { name: 'Aún no hay fotografías disponibles' })).toBeVisible()
})

test('shows an error when the requested pet does not exist', async ({ page }) => {
  await page.goto('/HU01.html#galeria/inexistente')
  await expect(page.locator('.gallery-message[role="alert"]'))
    .toContainText('No encontramos a esta mascota')
})
