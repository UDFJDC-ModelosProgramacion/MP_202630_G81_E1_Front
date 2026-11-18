import { expect, test, type Page } from '@playwright/test'

const cors = { 'access-control-allow-origin': '*' }
const json = (status: number, body: unknown) => ({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) })
const refugio = { id: 7, nombre: 'Huellitas', ciudad: 'Bogotá', direccion: 'Calle 1 # 2-3', telefono: '3001234567', correo: 'h@refugio.co', descripcion: 'Refugio de perros' }
const mora = { id: 1, nombre: 'Mora', especie: 'Perro', raza: 'Criollo', edad: 3, estado: 'Disponible', refugio: { id: 7, nombre: 'Huellitas' } }
const felix = { id: 2, nombre: 'Félix', especie: 'Gato', edad: 1, estado: 'Adoptado', refugio: { id: 9, nombre: 'Otro' } }

async function mockApi(page: Page, shelter: unknown = refugio, pets: unknown = [mora, felix]) {
  await page.route(/\/api\/refugios\/7$/, (route) => route.fulfill(json(200, shelter)))
  await page.route(/\/api\/mascotas$/, (route) => route.fulfill(json(200, pets)))
}

test('shows the contact data and the pets of the shelter', async ({ page }) => {
  await mockApi(page)
  await page.goto('/HU31.html?id=7')

  const detail = page.getByTestId('shelter-detail')
  await expect(detail).toContainText('Huellitas')
  await expect(detail).toContainText('Bogotá')
  await expect(detail).toContainText('Calle 1 # 2-3')
  await expect(detail).toContainText('3001234567')
  await expect(detail).toContainText('h@refugio.co')
  await expect(page.getByTestId('shelter-pet')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Mora' })).toHaveAttribute('href', './HU33.html?id=1')
})

test('uses the pets that come inside the shelter detail', async ({ page }) => {
  await mockApi(page, { ...refugio, mascotas: [mora, { ...felix, id: 5, nombre: 'Rocky' }] })
  await page.goto('/HU31.html?id=7')
  await expect(page.getByTestId('shelter-pet')).toHaveCount(2)
})

test('tells when the shelter has no pets', async ({ page }) => {
  await mockApi(page, refugio, [felix])
  await page.goto('/HU31.html?id=7')

  await expect(page.getByTestId('shelter-detail')).toContainText('Huellitas')
  await expect(page.getByText('Este refugio no tiene mascotas registradas.')).toBeVisible()
})

test('opens a shelter from its number', async ({ page }) => {
  await mockApi(page)
  await page.goto('/HU31.html')

  await page.locator('#lookup-id').fill('abc')
  await page.getByRole('button', { name: /Consultar refugio/ }).click()
  await expect(page.getByText('Ingresa el número del refugio.')).toBeVisible()

  await page.locator('#lookup-id').fill('7')
  await page.getByRole('button', { name: /Consultar refugio/ }).click()
  await expect(page).toHaveURL(/HU31\.html\?id=7$/)
  await expect(page.getByTestId('shelter-detail')).toContainText('Huellitas')
})

test('shows an error when the shelter does not exist', async ({ page }) => {
  await page.route(/\/api\/refugios\/999$/, (route) => route.fulfill(json(404, {})))
  await page.goto('/HU31.html?id=999')

  await expect(page.getByRole('alert')).toContainText('El refugio no fue encontrado.')
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeHidden()
  await expect(page.getByTestId('shelter-detail')).toHaveCount(0)
})

test('shows an error when the id in the address is invalid', async ({ page }) => {
  await page.goto('/HU31.html?id=abc')
  await expect(page.getByRole('alert')).toContainText('El refugio no fue encontrado.')
})

test('lets the user retry when the server fails', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/refugios\/7$/, (route) => {
    calls += 1
    return calls === 1 ? route.fulfill(json(500, {})) : route.fulfill(json(200, { ...refugio, mascotas: [] }))
  })
  await page.goto('/HU31.html?id=7')

  await expect(page.getByRole('alert')).toContainText('no pudo entregar la información del refugio')
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByTestId('shelter-detail')).toContainText('Huellitas')
  await expect(page.getByRole('alert')).toBeHidden()
})

test('shows an error when the server cannot be reached', async ({ page }) => {
  await page.route(/\/api\/refugios\/7$/, (route) => route.abort('connectionrefused'))
  await page.goto('/HU31.html?id=7')
  await expect(page.getByRole('alert')).toContainText('No pudimos conectar con el servidor')
})
