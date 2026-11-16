import { expect, test } from '@playwright/test'
import { mockApi } from './helpers/api'

const adoptante = { id: 4, nombre: 'Camila', email: 'c@x.co', telefono: '3001234567', ciudad: 'Bogotá', direccion: 'Cra 1' }

test('HU10 shows the profile and saves the changes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('huellitas.adoptanteId', '4'))
  await mockApi(page, {
    'GET /adoptantes/4': [200, adoptante],
    'PUT /adoptantes/4': [200, { ...adoptante, nombre: 'Camila Rojas' }],
  })
  await page.goto('/HU10.html')
  await expect(page.locator('#profile-data')).toContainText('Camila')

  await page.getByRole('button', { name: 'Editar perfil' }).click()
  await page.getByLabel('Correo electrónico').fill('correo-invalido')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('#profile-email-error')).toContainText('correo')

  await page.getByLabel('Correo electrónico').fill('c@x.co')
  await page.getByLabel('Nombre completo').fill('Camila Rojas')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('#profile-feedback')).toHaveText('Perfil actualizado correctamente.')
  await expect(page.locator('#profile-data')).toContainText('Camila Rojas')
})

test('HU10 keeps the original data when the edition is cancelled', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('huellitas.adoptanteId', '4'))
  await mockApi(page, { 'GET /adoptantes/4': [200, adoptante] })
  await page.goto('/HU10.html')
  await page.getByRole('button', { name: 'Editar perfil' }).click()
  await page.getByLabel('Nombre completo').fill('Otro nombre')
  await page.getByRole('button', { name: 'Cancelar' }).click()

  await expect(page.locator('#profile-data')).toContainText('Camila')
  await expect(page.locator('#profile-data')).not.toContainText('Otro nombre')
})
