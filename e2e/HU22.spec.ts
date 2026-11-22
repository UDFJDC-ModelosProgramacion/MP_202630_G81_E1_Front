import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/HU22.html')
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
test('opens and closes the navigation menu', async ({ page }) => {

  await page.setViewportSize({
    width: 390,
    height: 844,
  })

  const menu = page.locator('.menu-toggle')

  await menu.click()

  await expect(menu)
    .toHaveAttribute('aria-expanded', 'true')

  await expect(page.locator('.header-nav'))
    .toHaveClass(/nav-open/)

  await expect(
    page.locator('#primary-navigation a[href$="HU23.html"]'),
  ).toBeVisible()

  await menu.click()

  await expect(menu)
    .toHaveAttribute('aria-expanded', 'false')

  await expect(page.locator('.header-nav'))
    .not.toHaveClass(/nav-open/)
})