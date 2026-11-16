import { expect, test } from '@playwright/test'

test('HU04 filters the chronological timeline by event type and date range', async ({ page }) => {
  await page.goto('/HU04.html')
  await page.evaluate(() => {
    localStorage.setItem('huellitas.lifeEvents', JSON.stringify([
      { id: 'birth', petId: 'mora', petName: 'Mora', type: 'Nacimiento', date: '2020-01-01', description: 'Nació en el refugio.' },
      { id: 'vaccine', petId: 'mora', petName: 'Mora', type: 'Vacunación', date: '2024-02-01', description: 'Primera vacuna.' },
      { id: 'other', petId: 'luna', petName: 'Luna', type: 'Enfermedad', date: '2022-01-01', description: 'Otro evento.' },
    ]))
  })
  await page.reload()
  await expect(page.locator('.timeline-item')).toHaveCount(2)
  await expect(page.locator('.timeline-item').first()).toContainText('2020-01-01')

  await page.getByLabel('Tipo de evento').selectOption('Vacunación')
  await page.getByLabel('Desde').fill('2024-01-01')
  await page.getByLabel('Hasta').fill('2024-12-31')
  await page.getByRole('button', { name: 'Filtrar' }).click()
  await expect(page.locator('.timeline-item')).toHaveCount(1)
  await expect(page.locator('.timeline-item')).toContainText('Primera vacuna')

  await page.getByLabel('Tipo de evento').selectOption('Todos')
  await page.getByLabel('Desde').fill('2024-01-01')
  await page.getByLabel('Hasta').fill('2025-01-01')
  await page.getByRole('button', { name: 'Filtrar' }).click()
  await expect(page.locator('.timeline-item')).toHaveCount(1)
  await expect(page.locator('.timeline-item')).toContainText('Primera vacuna')

  await page.getByLabel('Desde').fill('2025-01-01')
  await page.getByLabel('Hasta').fill('2024-01-01')
  await page.getByRole('button', { name: 'Filtrar' }).click()
  await expect(page.getByRole('alert')).toContainText('La fecha inicial no puede ser posterior')
})

test('HU04 reports when the requested pet is not found', async ({ page }) => {
  await page.goto('/HU04.html?mascota=missing')
  await expect(page.getByRole('alert')).toContainText('No encontramos a esta mascota')
})
