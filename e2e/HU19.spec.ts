import { expect, test } from '@playwright/test'

test('HU19 validates required information, formalizes the adoption and assigns follow-up', async ({ page }) => {
  await page.goto('/HU19.html')
  await page.getByRole('button', { name: 'Formalizar adopción' }).click()

  await expect(page.getByRole('alert')).toContainText('Revisa los campos marcados')
  await expect(page.locator('#adopterName-error')).toHaveText('Ingresa el nombre del adoptante.')

  await page.getByLabel('Nombre del adoptante').fill('Camila Rodríguez')
  await page.getByLabel('Nombre de la mascota').fill('Mora')
  await page.getByLabel('Fecha de adopción').fill('2026-10-25')
  await page.getByLabel('Veterinario responsable').selectOption('Dra. Valentina Ríos')
  await page.getByLabel('Próxima cita de seguimiento').fill('2026-11-25')
  await page.getByLabel('Observaciones').fill('Control de adaptación')
  await page.getByRole('button', { name: 'Formalizar adopción' }).click()

  await expect(page.getByRole('heading', { name: '¡Una historia comienza!' })).toBeVisible()
  await expect(page.locator('#workflow-summary')).toContainText('Veterinario: Dra. Valentina Ríos')

  const adoptions = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('huellitas.formalizations') ?? '[]'),
  )
  expect(adoptions).toHaveLength(1)
  expect(adoptions[0]).toMatchObject({
    petName: 'Mora',
    adopterName: 'Camila Rodríguez',
    veterinarian: 'Dra. Valentina Ríos',
    status: 'Formalizada',
    followUpStatus: 'Programado',
  })

  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('huellitas.petHistory') ?? '[]'),
  )
  expect(history).toMatchObject([
    { type: 'Adopción', adoptionId: adoptions[0].id, veterinarian: 'Dra. Valentina Ríos' },
  ])
  const availability = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('huellitas.petAvailability') ?? '[]'),
  )
  expect(availability).toEqual([{ petName: 'Mora', status: 'Adoptada' }])
})
