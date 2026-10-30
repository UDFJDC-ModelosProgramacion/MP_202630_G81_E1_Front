import { expect, test } from '@playwright/test'

test('HU03 rejects future dates, registers an event and edits it', async ({ page }) => {
  await page.goto('/HU03.html')
  await page.getByLabel('Mascota').selectOption('mora')
  await page.getByLabel('Tipo de evento').selectOption('Vacunación')
  await page.getByLabel('Fecha del evento').fill('2099-12-31')
  await page.getByLabel('Descripción').fill('Dosis de refuerzo')
  await page.getByRole('button', { name: 'Guardar evento' }).click()
  await expect(page.getByRole('status')).toContainText('La fecha del evento no puede ser futura')

  await page.getByLabel('Fecha del evento').fill('2026-10-28')
  await page.getByRole('button', { name: 'Guardar evento' }).click()
  await expect(page.getByRole('status')).toContainText('Evento guardado')
  await expect(page.locator('.event-record')).toContainText('Mora')
  const savedEvent = await page.evaluate(() => JSON.parse(localStorage.getItem('huellitas.lifeEvents') ?? '[]')[0])
  const savedHistory = await page.evaluate(() => JSON.parse(localStorage.getItem('huellitas.petHistory') ?? '[]'))
  expect(savedHistory).toContainEqual(expect.objectContaining({ eventId: savedEvent.id, type: 'Vacunación' }))

  await page.locator('.event-record').getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Descripción').fill('Refuerzo aplicado correctamente')
  await page.getByRole('button', { name: 'Guardar evento' }).click()
  await expect(page.locator('.event-record')).toContainText('Refuerzo aplicado correctamente')
})
