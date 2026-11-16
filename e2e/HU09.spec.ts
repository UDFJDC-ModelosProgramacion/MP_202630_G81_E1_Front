import { expect, test, type Page } from '@playwright/test'
import { mockApi } from './helpers/api'

async function fillForm(page: Page) {
  await page.getByLabel('Nombre completo').fill('Camila Rodríguez')
  await page.getByLabel('Correo electrónico').fill('camila@example.com')
  await page.getByLabel('Teléfono de contacto').fill('3001234567')
  await page.getByLabel('Ciudad').fill('Bogotá')
  await page.getByLabel('Dirección').fill('Cra. 10 #20-30')
}

test('HU09 validates the form and registers an adoptante', async ({ page }) => {
  await mockApi(page, { 'POST /adoptantes': [201, { id: 5, nombre: 'Camila Rodríguez' }] })
  await page.goto('/HU09.html')
  await page.getByRole('button', { name: /Registrarme/ }).click()
  await expect(page.locator('#nombre-error')).toHaveText('Escribe tu nombre completo.')

  await fillForm(page)
  await page.getByRole('button', { name: /Registrarme/ }).click()

  await expect(page.getByRole('heading', { name: 'Tu registro fue exitoso' })).toBeVisible()
  await expect(page.locator('#adoptante-reference')).toHaveText('5')
  expect(await page.evaluate(() => localStorage.getItem('huellitas.adoptanteId'))).toBe('5')
})

test('HU09 shows the message of the API when the email already exists', async ({ page }) => {
  await mockApi(page, {
    'POST /adoptantes': [412, { apierror: { message: 'Ya existe un adoptante registrado con ese correo electrónico' } }],
  })
  await page.goto('/HU09.html')
  await fillForm(page)
  await page.getByRole('button', { name: /Registrarme/ }).click()

  await expect(page.locator('#form-error')).toContainText('Ya existe un adoptante registrado')
})
