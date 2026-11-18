import { expect, test, type Page } from '@playwright/test'

const cors = { 'access-control-allow-origin': '*' }
const json = (status: number, body: unknown) => ({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) })
const vet = { id: 4, nombre: 'Dra. Ana Ruiz' }
const programado = { id: 9, fechaAsignacion: '2026-11-10', proximaCita: '2026-12-10', observacion: 'Vacuna anual', estado: 'Programado', mascota: { id: 1 }, veterinario: vet }
const completado = { id: 10, fechaAsignacion: '2026-10-01', proximaCita: null, observacion: 'Control terminado', estado: 'Completado', mascota: { id: 1 }, veterinario: vet }
const base: Record<string, string> = { fechaAsignacion: '2026-11-10', proximaCita: '2026-12-10', observacion: 'Vacuna anual', mascotaId: '1', veterinarioId: '4' }

async function fillFollowUp(page: Page, values: Record<string, string> = base, estado = 'Programado') {
  for (const [name, value] of Object.entries(values)) await page.locator(`#fu-${name}`).fill(value)
  await page.locator('#fu-estado').selectOption(estado)
}

async function mockPet(page: Page, list: unknown[]) {
  await page.route(/\/api\/mascotas\/1$/, (route) => route.fulfill(json(200, { id: 1, nombre: 'Mora', seguimientos: list })))
}

async function consult(page: Page) {
  await page.locator('#lookup-id').fill('1')
  await page.getByRole('button', { name: 'Consultar seguimientos' }).click()
}

test('schedules a follow-up for a pet and a veterinarian', async ({ page }) => {
  let sent: unknown = null
  await page.route(/\/api\/seguimientos$/, (route) => {
    sent = route.request().postDataJSON()
    return route.fulfill(json(201, programado))
  })
  await page.goto('/HU35.html')
  await fillFollowUp(page)
  await page.getByRole('button', { name: /Programar seguimiento/ }).click()

  await expect(page.getByText('Seguimiento programado correctamente.')).toBeVisible()
  expect(sent).toEqual({
    fechaAsignacion: '2026-11-10', proximaCita: '2026-12-10', observacion: 'Vacuna anual', estado: 'Programado',
    mascota: { id: 1 }, veterinario: { id: 4 },
  })
})

test('requires the assignment date without calling the API', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/seguimientos/, (route) => { calls += 1; return route.fulfill(json(201, {})) })
  await page.goto('/HU35.html')

  await page.getByRole('button', { name: /Programar seguimiento/ }).click()

  await expect(page.getByText('La fecha de asignación es obligatoria.')).toBeVisible()
  await expect(page.getByText('El número de mascota es obligatorio.')).toBeVisible()
  await expect(page.locator('#fu-fechaAsignacion')).toBeFocused()
  expect(calls).toBe(0)
})

test('does not accept a next appointment before the assignment date', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/seguimientos/, (route) => { calls += 1; return route.fulfill(json(201, {})) })
  await page.goto('/HU35.html')
  await fillFollowUp(page, { ...base, proximaCita: '2026-11-01' })
  await page.getByRole('button', { name: /Programar seguimiento/ }).click()

  await expect(page.getByText('La próxima cita no puede ser anterior a la fecha de asignación.')).toBeVisible()
  expect(calls).toBe(0)
})

test('shows an error when the pet or the veterinarian does not exist', async ({ page }) => {
  await page.route(/\/api\/seguimientos$/, (route) => route.fulfill(json(404, {})))
  await page.goto('/HU35.html')
  await fillFollowUp(page, { ...base, mascotaId: '999' })
  await page.getByRole('button', { name: /Programar seguimiento/ }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'La mascota o el veterinario indicado no existe.' })).toBeVisible()
})

test('lists the follow-ups of a pet', async ({ page }) => {
  await mockPet(page, [programado, completado])
  await page.goto('/HU35.html')
  await consult(page)

  await expect(page.getByTestId('followup-item')).toHaveCount(2)
  await expect(page.getByTestId('followup-item').first()).toContainText('2026-11-10')
  await expect(page.getByTestId('followup-item').first()).toContainText('próxima cita 2026-12-10')
  await expect(page.getByText('Mascota: Mora')).toBeVisible()
})

test('filters the follow-ups from the general list when the pet detail has none', async ({ page }) => {
  await page.route(/\/api\/mascotas\/1$/, (route) => route.fulfill(json(200, { id: 1, nombre: 'Mora' })))
  await page.route(/\/api\/seguimientos$/, (route) =>
    route.fulfill(json(200, [programado, { ...completado, id: 11, mascota: { id: 2 } }])))
  await page.goto('/HU35.html')
  await consult(page)

  await expect(page.getByTestId('followup-item')).toHaveCount(1)
})

test('tells when the pet has no follow-ups', async ({ page }) => {
  await mockPet(page, [])
  await page.goto('/HU35.html')
  await consult(page)
  await expect(page.getByText('Esta mascota no tiene seguimientos registrados.')).toBeVisible()
})

test('shows an error when the pet does not exist or the number is invalid', async ({ page }) => {
  await page.route(/\/api\/mascotas\/99$/, (route) => route.fulfill(json(404, {})))
  await page.goto('/HU35.html')

  await page.locator('#lookup-id').fill('99')
  await page.getByRole('button', { name: 'Consultar seguimientos' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'La mascota no fue encontrada.' })).toBeVisible()

  await page.locator('#lookup-id').fill('abc')
  await page.getByRole('button', { name: 'Consultar seguimientos' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Ingresa el número de la mascota.' })).toBeVisible()
})

test('edits a follow-up that is not completed', async ({ page }) => {
  let sent: unknown = null
  await mockPet(page, [programado])
  await page.route(/\/api\/seguimientos\/9$/, (route) => {
    sent = route.request().postDataJSON()
    return route.fulfill(json(200, { ...programado, observacion: 'Cambio' }))
  })
  await page.goto('/HU35.html')
  await consult(page)
  await page.getByRole('button', { name: 'Editar' }).click()

  await expect(page.getByRole('heading', { name: 'Editar seguimiento' })).toBeVisible()
  await expect(page.locator('#fu-observacion')).toHaveValue('Vacuna anual')
  await expect(page.locator('#fu-veterinarioId')).toHaveValue('4')
  await page.locator('#fu-observacion').fill('Cambio')
  await page.getByRole('button', { name: /Guardar cambios/ }).click()

  await expect(page.getByText('Seguimiento actualizado correctamente.')).toBeVisible()
  expect((sent as { observacion: string }).observacion).toBe('Cambio')
  await expect(page.getByRole('heading', { name: 'Programar seguimiento' })).toBeVisible()
})

test('can cancel an edition', async ({ page }) => {
  await mockPet(page, [programado])
  await page.goto('/HU35.html')
  await consult(page)
  await page.getByRole('button', { name: 'Editar' }).click()
  await page.getByRole('button', { name: 'Cancelar edición' }).click()

  await expect(page.getByRole('heading', { name: 'Programar seguimiento' })).toBeVisible()
  await expect(page.locator('#fu-observacion')).toHaveValue('')
})

test('does not allow editing or deleting a completed follow-up', async ({ page }) => {
  let calls = 0
  await mockPet(page, [completado])
  await page.route(/\/api\/seguimientos\/10$/, (route) => { calls += 1; return route.fulfill(json(200, completado)) })
  await page.goto('/HU35.html')
  await consult(page)

  await page.getByRole('button', { name: 'Editar' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'No se puede modificar ni eliminar un seguimiento en estado "Completado".' })).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'No se puede modificar ni eliminar un seguimiento en estado "Completado".' })).toBeVisible()
  expect(calls).toBe(0)
})

test('deletes a follow-up that is not completed after confirming', async ({ page }) => {
  let method = ''
  let listed = 0
  await page.route(/\/api\/mascotas\/1$/, (route) => {
    listed += 1
    return route.fulfill(json(200, { id: 1, nombre: 'Mora', seguimientos: listed === 1 ? [programado] : [] }))
  })
  await page.route(/\/api\/seguimientos\/9$/, (route) => {
    method = route.request().method()
    return route.fulfill({ status: 204, headers: cors })
  })
  await page.goto('/HU35.html')
  await consult(page)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Eliminar' }).click()

  await expect(page.getByText('Seguimiento eliminado correctamente.')).toBeVisible()
  await expect(page.getByText('Esta mascota no tiene seguimientos registrados.')).toBeVisible()
  expect(method).toBe('DELETE')
})

test('does not delete when the user cancels', async ({ page }) => {
  let calls = 0
  await mockPet(page, [programado])
  await page.route(/\/api\/seguimientos\/9$/, (route) => { calls += 1; return route.fulfill({ status: 204, headers: cors }) })
  await page.goto('/HU35.html')
  await consult(page)
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Eliminar' }).click()

  expect(calls).toBe(0)
  await expect(page.getByTestId('followup-item')).toHaveCount(1)
})
