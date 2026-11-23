import { expect, test } from '@playwright/test'

const cors = { 'access-control-allow-origin': '*' }
const json = (status: number, body: unknown) => ({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) })

async function fillPet(page: import('@playwright/test').Page, extra: Record<string, string> = {}) {
  const values: Record<string, string> = { nombre: 'Mora', especie: 'Perro', raza: 'Criollo', edad: '3', estado: 'Disponible', ...extra }
  for (const [name, value] of Object.entries(values)) {
    const field = page.locator(`#pet-${name}`)
    if (name === 'estado' || name === 'sexo' || name === 'tamano') await field.selectOption(value)
    else await field.fill(value)
  }
}

test('registers a pet and sends the data the API expects', async ({ page }) => {
  let sent: unknown = null
  await page.route(/\/api\/mascotas$/, (route) => {
    sent = route.request().postDataJSON()
    return route.fulfill(json(201, { id: 5, nombre: 'Mora', especie: 'Perro' }))
  })
  await page.goto('/HU32.html')
  await fillPet(page, { sexo: 'Hembra', tamano: 'Mediano', temperamento: 'Juguetona', refugioId: '7' })
  await page.getByRole('button', { name: /Registrar mascota/ }).click()

  await expect(page.getByText('Mascota «Mora» registrada correctamente.')).toBeVisible()
  expect(sent).toEqual({
    nombre: 'Mora', especie: 'Perro', raza: 'Criollo', edad: 3, sexo: 'Hembra', tamano: 'Mediano',
    temperamento: 'Juguetona', estado: 'Disponible', refugio: { id: 7 },
  })
  await expect(page.locator('#pet-nombre')).toHaveValue('')
})

test('rejects an empty name, species and state without calling the API', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/mascotas/, (route) => { calls += 1; return route.fulfill(json(201, {})) })
  await page.goto('/HU32.html')

  await page.getByRole('button', { name: /Registrar mascota/ }).click()

  await expect(page.getByText('El nombre es obligatorio.')).toBeVisible()
  await expect(page.getByText('La especie es obligatoria.')).toBeVisible()
  await expect(page.getByText('Selecciona el estado de la mascota.')).toBeVisible()
  await expect(page.locator('#pet-nombre')).toBeFocused()
  expect(calls).toBe(0)
})

test('does not accept a negative age', async ({ page }) => {
  await page.goto('/HU32.html')
  await fillPet(page, { edad: '-2' })
  await page.getByRole('button', { name: /Registrar mascota/ }).click()

  await expect(page.locator('#pet-edad-error')).toHaveText('La edad no puede ser negativa.')
  await expect(page.locator('#pet-edad')).toHaveAttribute('aria-invalid', 'true')
})

test('shows an error when the shelter does not exist', async ({ page }) => {
  await page.route(/\/api\/mascotas$/, (route) => route.fulfill(json(404, {})))
  await page.goto('/HU32.html')
  await fillPet(page, { refugioId: '999' })
  await page.getByRole('button', { name: /Registrar mascota/ }).click()

  await expect(page.getByRole('alert')).toContainText('El refugio indicado no existe.')
  await expect(page.locator('#pet-nombre')).toHaveValue('Mora')
})

test('shows the message of the API when it rejects the pet', async ({ page }) => {
  await page.route(/\/api\/mascotas$/, (route) => route.fulfill(json(400, { apierror: { message: 'Estado inválido' } })))
  await page.goto('/HU32.html')
  await fillPet(page)
  await page.getByRole('button', { name: /Registrar mascota/ }).click()

  await expect(page.getByRole('alert')).toContainText('Estado inválido')
})

test('deletes a pet after confirming', async ({ page }) => {
  let method = ''
  await page.route(/\/api\/mascotas\/5$/, (route) => {
    method = route.request().method()
    return route.fulfill({ status: 204, headers: cors })
  })
  await page.goto('/HU32.html')
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('#delete-id').fill('5')
  await page.getByRole('button', { name: 'Eliminar mascota' }).click()

  await expect(page.getByText('Mascota eliminada correctamente.')).toBeVisible()
  expect(method).toBe('DELETE')
})

test('does not delete when the user cancels', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/mascotas\/5$/, (route) => { calls += 1; return route.fulfill({ status: 204, headers: cors }) })
  await page.goto('/HU32.html')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.locator('#delete-id').fill('5')
  await page.getByRole('button', { name: 'Eliminar mascota' }).click()

  await expect(page.getByText('Mascota eliminada correctamente.')).toHaveCount(0)
  expect(calls).toBe(0)
})

test('shows the error when the pet has veterinary follow-ups', async ({ page }) => {
  const message = 'No se puede eliminar una mascota con seguimientos veterinarios'
  await page.route(/\/api\/mascotas\/5$/, (route) => route.fulfill(json(409, { apierror: { message } })))
  await page.goto('/HU32.html')
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('#delete-id').fill('5')
  await page.getByRole('button', { name: 'Eliminar mascota' }).click()

  await expect(page.getByRole('alert')).toContainText(message)
})

test('asks for a valid number and reports a pet that does not exist', async ({ page }) => {
  await page.route(/\/api\/mascotas\/99$/, (route) => route.fulfill(json(404, {})))
  await page.goto('/HU32.html')

  await page.getByRole('button', { name: 'Eliminar mascota' }).click()
  await expect(page.getByText('Ingresa el número de la mascota.')).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('#delete-id').fill('99')
  await page.getByRole('button', { name: 'Eliminar mascota' }).click()
  await expect(page.getByRole('alert')).toContainText('La mascota no fue encontrada.')
})
