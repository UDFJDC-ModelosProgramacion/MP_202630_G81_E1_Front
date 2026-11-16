import { expect, test } from '@playwright/test'

test('HU21 records a return, preserves previous history and marks the pet for evaluation', async ({ page }) => {
  await page.goto('/HU21.html')
  await page.evaluate(() => {
    localStorage.setItem('huellitas.petHistory', JSON.stringify([
      { type: 'Adopción', petName: 'Mora', adoptionId: 'HU19-OLD' },
    ]))
    localStorage.setItem('huellitas.petAvailability', JSON.stringify([
      { petName: 'Mora', status: 'Adoptada' },
    ]))
    localStorage.setItem('huellitas.formalizations', JSON.stringify([
      { id: 'HU19-OLD', petName: 'Mora', status: 'Formalizada' },
    ]))
  })

  await page.getByLabel('Nombre de la mascota').fill('Mora')
  await page.getByLabel('Nombre del adoptante').fill('Camila Rodríguez')
  await page.getByLabel('Fecha de devolución').fill('2026-10-25')
  await page.getByLabel('Motivo de la devolución').selectOption('Situación de salud de la mascota')
  await page.getByLabel('Descripción de la situación').fill('Necesita valoración veterinaria antes de una nueva adopción.')
  await page.getByLabel('No, requiere evaluación').check()
  await page.getByRole('button', { name: 'Registrar devolución' }).click()

  await expect(page.getByRole('heading', { name: 'Su historial quedó actualizado' })).toBeVisible()
  await expect(page.locator('#workflow-summary')).toContainText('Disponibilidad: En evaluación')
  const result = await page.evaluate(() => ({
    returns: JSON.parse(localStorage.getItem('huellitas.returns') ?? '[]'),
    history: JSON.parse(localStorage.getItem('huellitas.petHistory') ?? '[]'),
    availability: JSON.parse(localStorage.getItem('huellitas.petAvailability') ?? '[]'),
    adoptions: JSON.parse(localStorage.getItem('huellitas.formalizations') ?? '[]'),
  }))

  expect(result.returns).toHaveLength(1)
  expect(result.returns[0]).toMatchObject({
    petName: 'Mora',
    reason: 'Situación de salud de la mascota',
    compatibleReAdoption: false,
    availability: 'En evaluación',
  })
  expect(result.history).toHaveLength(2)
  expect(result.history[0].type).toBe('Adopción')
  expect(result.history[1].type).toBe('Retorno')
  expect(result.availability).toEqual([{ petName: 'Mora', status: 'En evaluación' }])
  expect(result.adoptions).toEqual([{ id: 'HU19-OLD', petName: 'Mora', status: 'Formalizada' }])
})

test('HU21 marks the pet available for readoption when it is ready', async ({ page }) => {
  await page.goto('/HU21.html')
  await page.getByLabel('Nombre de la mascota').fill('Nube')
  await page.getByLabel('Nombre del adoptante').fill('Diego Pérez')
  await page.getByLabel('Fecha de devolución').fill('2026-10-25')
  await page.getByLabel('Motivo de la devolución').selectOption('Cambio en las circunstancias del adoptante')
  await page.getByLabel('Descripción de la situación').fill('La familia se muda a una vivienda que no admite mascotas.')
  await page.getByLabel('Sí, puede volver a estar disponible').check()
  await page.getByRole('button', { name: 'Registrar devolución' }).click()

  const availability = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('huellitas.petAvailability') ?? '[]'),
  )
  expect(availability).toEqual([{ petName: 'Nube', status: 'Disponible' }])
})
