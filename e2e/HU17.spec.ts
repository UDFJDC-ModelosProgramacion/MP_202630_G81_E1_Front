import { expect, test } from '@playwright/test'
import { mockApi } from './helpers/api'

test('HU17 shows the notifications of the adoptante, newest first', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('huellitas.adoptanteId', '4'))
  await mockApi(page, {
    'GET /notificaciones/adoptante/4': [200, [
      { id: 1, tipo: 'Vacuna', mensaje: 'Vacuna próxima', fecha: '2026-10-01T05:00:00.000+00:00', canal: 'Correo' },
      { id: 2, tipo: 'Adopción', mensaje: 'Solicitud aprobada', fecha: '2026-10-20T05:00:00.000+00:00', canal: 'SMS' },
    ]],
  })
  await page.goto('/HU17.html')

  await expect(page.locator('#notifications-list li')).toHaveCount(2)
  await expect(page.locator('#notifications-list li').first()).toContainText('Solicitud aprobada')
  await expect(page.locator('#notifications-list li').first()).toContainText('Canal: SMS')
})

test('HU17 asks the visitor to register first', async ({ page }) => {
  await page.goto('/HU17.html')
  await expect(page.locator('#notifications-feedback')).toContainText('Regístrate primero')
})
