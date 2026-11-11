import { expect, test } from '@playwright/test'

test('HU06 displays success stories and empty or inactive states', async ({ page }) => {
  await page.goto('/HU06.html')
  await page.evaluate(() => localStorage.setItem('huellitas.successStories', JSON.stringify([
    { id: 'story-1', petId: 'mora', petName: 'Mora', title: 'Luna ya tiene hogar', description: 'Una familia la recibió con cariño.', createdAt: '2026-03-10T12:00:00.000Z' },
  ])))
  await page.reload()
  await expect(page.locator('.story-record')).toContainText('Luna ya tiene hogar')
  await expect(page.locator('.story-record')).toContainText('2026-03-10')

  await page.getByLabel('Mascota').selectOption('luna')
  await expect(page.getByRole('status')).toContainText('aún no tiene historias')
  await page.evaluate(() => localStorage.setItem('huellitas.petRegistry', JSON.stringify([{ petName: 'Mora', status: 'Inactiva' }])))
  await page.getByLabel('Mascota').selectOption('mora')
  await expect(page.getByRole('status')).toContainText('mascota está inactiva')
})