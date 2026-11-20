import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test('marks backend messages read/unread and prevents deleting read messages', async ({ page }) => {
  const api = await mockStoryApi(page, {
    messages: [
      { id: 31, adoptanteId: 10, mascotaId: 1, mascota: { id: 1, nombre: 'Mora' }, asunto: 'Pregunta sobre vacunas', contenido: 'Consulta', fecha: '2026-03-10', leido: false },
      { id: 32, adoptanteId: 10, mascotaId: 2, mascota: { id: 2, nombre: 'Luna' }, asunto: 'Horario de visita', contenido: 'Consulta', fecha: '2026-03-11', leido: false },
    ],
  })
  await page.goto('/HU08.html')
  await page.getByLabel('Seleccionar Pregunta sobre vacunas').check()
  await page.getByLabel('Seleccionar Horario de visita').check()
  await page.locator('#mark-selected-read').click()
  await expect(page.getByRole('status')).toContainText('Mensajes marcados como leídos')
  await expect(page.locator('.message-record .record-badge')).toHaveText(['Leído', 'Leído'])
  expect(api.messages.every((message) => message.leido === true)).toBe(true)

  const readDelete = page.locator('.message-record').filter({ hasText: 'Pregunta sobre vacunas' }).getByRole('button', { name: 'Eliminar' })
  await expect(readDelete).toBeDisabled()
  await page.locator('.message-record').filter({ hasText: 'Pregunta sobre vacunas' }).getByRole('button', { name: 'Marcar como no leído' }).click()
  await expect(api.messages[0].leido).toBe(false)
  await page.locator('.message-record').filter({ hasText: 'Pregunta sobre vacunas' }).getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('.message-record')).toHaveCount(1)
  expect(api.messages).toHaveLength(1)
})
