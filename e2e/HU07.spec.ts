import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test('sends and edits messages in the backend adopter inbox', async ({ page }) => {
  const api = await mockStoryApi(page)
  await page.goto('/HU07.html')
  await page.getByLabel('Asunto').fill('Pregunta sobre vacunas')
  await page.getByLabel('Contenido').fill('¿Cuál es el esquema de vacunación?')
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  await expect(page.getByRole('status')).toContainText('Mensaje enviado')
  await expect(page.locator('.message-record')).toContainText('Pregunta sobre vacunas')
  expect(api.messages).toHaveLength(1)

  await page.locator('.message-record').getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Asunto').fill('Horario de visita')
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  await expect(page.locator('.message-record')).toContainText('Horario de visita')

  await page.getByLabel('Filtrar por mascota').selectOption('2')
  await expect(page.getByText('Aún no tienes mensajes.')).toBeVisible()
  await page.getByLabel('Filtrar por mascota').selectOption('1')
  await expect(page.locator('.message-record')).toContainText('Horario de visita')
})

test('requires a real registered adopter ID instead of a demo inbox', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('huellitas.adoptanteId'))
  await page.goto('/HU07.html')
  await expect(page.getByRole('status')).toContainText('Regístrate como adoptante en HU09')
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled()
})
