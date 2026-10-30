
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/actualizaciones.html')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('shows validation feedback for an incomplete update', async ({ page }) => {
  await page.getByRole('button', {
    name: 'Registrar actualización',
  }).click()

  await expect(page.getByRole('alert'))
    .toContainText('Revisa los campos marcados')

  await expect(page.locator('#target-type'))
    .toHaveAttribute('aria-invalid', 'true')
})

test('registers and displays an update', async ({ page }) => {
  await page.getByLabel('¿A quién corresponde?')
    .selectOption('mascota')

  await page.getByLabel('Identificador de la mascota o adoptante')
    .fill('MASC-001')

  await page.getByLabel('Título de la actualización')
    .fill('Seguimiento de adaptación')

  await page.getByLabel('Descripción')
    .fill('La mascota se adapta favorablemente al refugio.')

  await page.getByRole('button', {
    name: 'Registrar actualización',
  }).click()

  await expect(page.getByRole('status'))
    .toContainText('se registró correctamente')

  await expect(page.getByRole('heading', {
    name: 'Seguimiento de adaptación',
  })).toBeVisible()

  await expect(page.locator('#empty-state')).toBeHidden()

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('huellitas.actualizaciones') ?? '[]'),
  )

  expect(saved).toHaveLength(1)
  expect(saved[0]).toMatchObject({
    targetType: 'mascota',
    targetId: 'MASC-001',
    title: 'Seguimiento de adaptación',
  })
})
