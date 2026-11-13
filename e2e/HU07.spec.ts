import { expect, test } from '@playwright/test'

test('HU07 sends and edits an unread message and filters the inbox by pet', async ({ page }) => {
  await page.goto('/HU07.html')
  await page.getByLabel('Asunto').fill('Pregunta sobre vacunas')
  await page.getByLabel('Contenido').fill('¿Cuál es el esquema de vacunación?')
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  await expect(page.getByRole('status')).toContainText('Mensaje enviado')
  await expect(page.locator('.message-record')).toContainText('Pregunta sobre vacunas')

  await page.locator('.message-record').getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Asunto').fill('Horario de visita')
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  await expect(page.locator('.message-record')).toContainText('Horario de visita')

  await page.getByLabel('Filtrar por mascota').selectOption('luna')
  await expect(page.getByText('Aún no tienes mensajes.')).toBeVisible()
  await page.getByLabel('Filtrar por mascota').selectOption('mora')
  await expect(page.locator('.message-record')).toContainText('Horario de visita')
})