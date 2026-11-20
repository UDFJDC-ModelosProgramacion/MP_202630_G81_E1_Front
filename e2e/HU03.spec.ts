import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test('registers and edits life events in the backend', async ({ page }) => {
  const api = await mockStoryApi(page)
  await page.goto('/HU03.html')
  await page.getByLabel('Mascota').selectOption('1')
  await page.getByLabel('Tipo de evento').selectOption('Vacunación')
  await page.getByLabel('Fecha del evento').fill('2099-12-31')
  await page.getByLabel('Descripción').fill('Dosis de refuerzo')
  await page.getByRole('button', { name: 'Guardar evento' }).click()
  await expect(page.getByRole('status')).toContainText('La fecha del evento no puede ser futura')

  await page.getByLabel('Fecha del evento').fill('2024-10-28')
  await page.getByRole('button', { name: 'Guardar evento' }).click()
  await expect(page.getByRole('status')).toContainText('Evento guardado')
  await expect(page.locator('.event-record').filter({ hasText: 'Dosis de refuerzo' })).toContainText('Mora')
  expect(api.events[1]).toHaveLength(3)

  await page.locator('.event-record').filter({ hasText: 'Dosis de refuerzo' }).getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Descripción').fill('Refuerzo aplicado correctamente')
  await page.getByRole('button', { name: 'Guardar evento' }).click()
  await expect(page.locator('.event-record').filter({ hasText: 'Refuerzo aplicado correctamente' })).toBeVisible()
})
