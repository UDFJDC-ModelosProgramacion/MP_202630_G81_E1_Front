import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test('filters the backend timeline events by type and date range', async ({ page }) => {
  await mockStoryApi(page)
  await page.goto('/HU04.html')
  await expect(page.locator('.timeline-item')).toHaveCount(2)
  await expect(page.locator('.timeline-item').first()).toContainText('2020-01-01')

  await page.getByLabel('Tipo de evento').selectOption('Vacunación')
  await page.getByLabel('Desde').fill('2024-01-01')
  await page.getByLabel('Hasta').fill('2024-12-31')
  await page.getByRole('button', { name: 'Filtrar' }).click()
  await expect(page.locator('.timeline-item')).toHaveCount(1)
  await expect(page.locator('.timeline-item')).toContainText('Primera vacuna')

  await page.getByLabel('Desde').fill('2025-01-01')
  await page.getByLabel('Hasta').fill('2024-01-01')
  await page.getByRole('button', { name: 'Filtrar' }).click()
  await expect(page.getByRole('alert')).toContainText('La fecha inicial no puede ser posterior')
})

test('reports when the requested pet is not in the backend catalog', async ({ page }) => {
  await mockStoryApi(page)
  await page.goto('/HU04.html?mascota=999')
  await expect(page.getByRole('alert')).toContainText('No encontramos a esta mascota')
})
