import { expect, test, type Page } from '@playwright/test'

const cors = { 'access-control-allow-origin': '*' }
const json = (status: number, body: unknown) => ({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) })
const ana = { id: 4, nombre: 'Dra. Ana Ruiz', telefono: '3001112233', correo: 'ana@vet.co', especialidad: 'Medicina general', disponibilidad: 'Lunes a viernes', refugio: { id: 7, nombre: 'Huellitas' } }
const datos: Record<string, string> = { nombre: 'Dra. Ana Ruiz', telefono: '3001112233', correo: 'ana@vet.co', especialidad: 'Medicina general', disponibilidad: 'Lunes a viernes', refugioId: '7' }

async function fillVet(page: Page, values = datos) {
  for (const [name, value] of Object.entries(values)) await page.locator(`#vet-${name}`).fill(value)
}

test('lists the registered veterinarians', async ({ page }) => {
  await page.route(/\/api\/veterinarios$/, (route) => route.fulfill(json(200, [ana])))
  await page.goto('/HU34.html')

  await expect(page.getByTestId('vet-item')).toHaveCount(1)
  await expect(page.getByTestId('vet-item')).toContainText('Dra. Ana Ruiz')
  await expect(page.getByTestId('vet-item')).toContainText('Medicina general')
  await expect(page.getByTestId('vet-item')).toContainText('Huellitas')
})

test('tells when there are no veterinarians', async ({ page }) => {
  await page.route(/\/api\/veterinarios$/, (route) => route.fulfill(json(200, [])))
  await page.goto('/HU34.html')
  await expect(page.getByText('Aún no hay veterinarios registrados.')).toBeVisible()
})

test('registers a veterinarian associated with a shelter and refreshes the list', async ({ page }) => {
  const stored: unknown[] = []
  let sent: unknown = null
  await page.route(/\/api\/veterinarios$/, (route) => {
    if (route.request().method() === 'POST') {
      sent = route.request().postDataJSON()
      stored.push(ana)
      return route.fulfill(json(201, ana))
    }
    return route.fulfill(json(200, stored))
  })
  await page.goto('/HU34.html')
  await expect(page.getByText('Aún no hay veterinarios registrados.')).toBeVisible()

  await fillVet(page)
  await page.getByRole('button', { name: /Registrar veterinario/ }).click()

  await expect(page.getByText('Veterinario «Dra. Ana Ruiz» registrado correctamente.')).toBeVisible()
  expect(sent).toEqual({
    nombre: 'Dra. Ana Ruiz', telefono: '3001112233', correo: 'ana@vet.co', especialidad: 'Medicina general',
    disponibilidad: 'Lunes a viernes', refugio: { id: 7 },
  })
  await expect(page.getByTestId('vet-item')).toHaveCount(1)
})

test('rejects empty fields and an invalid email without calling the API', async ({ page }) => {
  let posts = 0
  await page.route(/\/api\/veterinarios$/, (route) => {
    if (route.request().method() === 'POST') posts += 1
    return route.fulfill(json(200, []))
  })
  await page.goto('/HU34.html')

  await page.getByRole('button', { name: /Registrar veterinario/ }).click()
  await expect(page.getByText('El nombre es obligatorio.')).toBeVisible()
  await expect(page.getByText('La especialidad es obligatoria.')).toBeVisible()
  await expect(page.getByText('El número de refugio es obligatorio.')).toBeVisible()

  await fillVet(page, { ...datos, correo: 'sin-arroba' })
  await page.getByRole('button', { name: /Registrar veterinario/ }).click()
  await expect(page.getByText(/Ingresa un correo válido/)).toBeVisible()
  expect(posts).toBe(0)
})

test('shows an error when the shelter does not exist', async ({ page }) => {
  await page.route(/\/api\/veterinarios$/, (route) =>
    route.request().method() === 'POST' ? route.fulfill(json(404, {})) : route.fulfill(json(200, [])))
  await page.goto('/HU34.html')
  await fillVet(page, { ...datos, refugioId: '999' })
  await page.getByRole('button', { name: /Registrar veterinario/ }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'El refugio indicado no existe.' })).toBeVisible()
})

test('consults a veterinarian by its number', async ({ page }) => {
  await page.route(/\/api\/veterinarios$/, (route) => route.fulfill(json(200, [])))
  await page.route(/\/api\/veterinarios\/4$/, (route) => route.fulfill(json(200, ana)))
  await page.goto('/HU34.html')

  await page.locator('#lookup-id').fill('4')
  await page.getByRole('button', { name: 'Consultar veterinario' }).click()

  await expect(page.getByTestId('vet-detail')).toContainText('Dra. Ana Ruiz')
  await expect(page.getByTestId('vet-detail')).toContainText('ana@vet.co')
})

test('shows an error when the veterinarian does not exist or the number is invalid', async ({ page }) => {
  await page.route(/\/api\/veterinarios$/, (route) => route.fulfill(json(200, [])))
  await page.route(/\/api\/veterinarios\/99$/, (route) => route.fulfill(json(404, {})))
  await page.goto('/HU34.html')

  await page.locator('#lookup-id').fill('99')
  await page.getByRole('button', { name: 'Consultar veterinario' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'El veterinario no fue encontrado.' })).toBeVisible()

  await page.locator('#lookup-id').fill('abc')
  await page.getByRole('button', { name: 'Consultar veterinario' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Ingresa el número del veterinario.' })).toBeVisible()
})

test('shows an error when the list fails and lets the user retry', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/veterinarios$/, (route) => {
    calls += 1
    return calls === 1 ? route.fulfill(json(500, {})) : route.fulfill(json(200, [ana]))
  })
  await page.goto('/HU34.html')

  await expect(page.getByRole('alert').filter({ hasText: 'no pudo entregar los veterinarios' })).toBeVisible()
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByTestId('vet-item')).toHaveCount(1)
})
