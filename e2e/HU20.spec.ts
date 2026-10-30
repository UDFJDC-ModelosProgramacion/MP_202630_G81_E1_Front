import { expect, test } from '@playwright/test'

test('HU20 schedules a trial and calculates the end date from its duration', async ({ page }) => {
  await page.goto('/HU20.html')
  await page.getByLabel('Nombre del adoptante').fill('Camila Rodríguez')
  await page.getByLabel('Nombre de la mascota').fill('Mora')
  await page.getByLabel('Fecha de inicio').fill('2026-10-25')
  await page.getByLabel('Duración en días').fill('1.5')
  await page.getByRole('button', { name: 'Programar prueba' }).click()

  await expect(page.locator('#durationDays-error')).toHaveText(
    'La duración debe ser un número entero mayor que cero.',
  )

  await page.getByLabel('Duración en días').fill('7')
  await page.getByLabel('Acuerdos u observaciones').fill('Llamada de seguimiento al tercer día')
  await page.getByRole('button', { name: 'Programar prueba' }).click()

  await expect(page.getByRole('heading', { name: '¡Comienza el tiempo de conocerse!' })).toBeVisible()
  await expect(page.locator('#workflow-summary')).toContainText('Fin: 2026-11-01')
  const trials = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('huellitas.trials') ?? '[]'),
  )
  expect(trials).toHaveLength(1)
  expect(trials[0]).toMatchObject({
    startDate: '2026-10-25',
    endDate: '2026-11-01',
    durationDays: 7,
    status: 'Programada',
  })
})
