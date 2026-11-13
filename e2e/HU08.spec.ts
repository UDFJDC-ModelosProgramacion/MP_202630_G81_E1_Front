import { expect, test } from '@playwright/test'

test('HU08 marks selected messages read and prevents deleting read messages', async ({ page }) => {
  await page.goto('/HU08.html')
  await page.evaluate(() => localStorage.setItem('huellitas.messages', JSON.stringify([
    { id: 'message-1', adopterId: 'samuel', petId: 'mora', petName: 'Mora', subject: 'Pregunta sobre vacunas', content: 'Consulta', createdAt: '2026-03-10T12:00:00.000Z', read: false },
    { id: 'message-2', adopterId: 'samuel', petId: 'luna', petName: 'Luna', subject: 'Horario de visita', content: 'Consulta', createdAt: '2026-03-11T12:00:00.000Z', read: false },
  ])))
  await page.reload()
  await page.getByLabel('Seleccionar Pregunta sobre vacunas').check()
  await page.getByLabel('Seleccionar Horario de visita').check()
  await page.locator('#mark-selected-read').click()
  await expect(page.getByRole('status')).toContainText('Mensajes marcados como leídos')
  await expect(page.locator('.message-record .record-badge')).toHaveText(['Leído', 'Leído'])

  await page.locator('.message-record').filter({ hasText: 'Pregunta sobre vacunas' }).getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('status')).toContainText('no puede eliminarse')
})