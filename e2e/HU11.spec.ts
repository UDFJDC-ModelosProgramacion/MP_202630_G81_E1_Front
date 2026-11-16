import { expect, test } from '@playwright/test'
import { mockApi } from './helpers/api'

test('HU11 lists the adoptantes and opens one detail', async ({ page }) => {
  await mockApi(page, {
    'GET /adoptantes': [200, [
      { id: 2, nombre: 'Laura', email: 'l@x.co', ciudad: 'Cali' },
      { id: 1, nombre: 'Ana', email: 'a@x.co', ciudad: 'Bogotá' },
    ]],
    'GET /adoptantes/1': [200, { id: 1, nombre: 'Ana', email: 'a@x.co', telefono: '3001234567', ciudad: 'Bogotá', direccion: 'Cra 1' }],
  })
  await page.goto('/HU11.html')
  await expect(page.locator('#adoptantes-list li')).toHaveCount(2)
  await expect(page.locator('#adoptantes-list li').first()).toContainText('Ana')

  await page.getByRole('button', { name: 'Ver detalle de Ana' }).click()
  await expect(page.locator('#adoptante-detail')).toContainText('Cra 1')
})

test('HU11 explains when there are no adoptantes', async ({ page }) => {
  await mockApi(page, { 'GET /adoptantes': [200, []] })
  await page.goto('/HU11.html')
  await expect(page.locator('#adoptantes-list')).toContainText('Aún no hay adoptantes registrados.')
})
