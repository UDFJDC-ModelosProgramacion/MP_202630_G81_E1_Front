import { expect, test, type Page } from '@playwright/test'

const refugio = { id: 7, nombre: 'Huellitas', ciudad: 'Bogotá' }
const mora = { id: 1, nombre: 'Mora', especie: 'Perro', raza: 'Criollo', edad: 3, sexo: 'Hembra', tamano: 'Mediano', temperamento: 'Juguetona', estado: 'Disponible', refugio }
const cors = { 'access-control-allow-origin': '*' }

async function mockApi(page: Page) {
  await page.route(/\/api\/mascotas$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify([mora]) }))
  await page.route(/\/api\/mascotas\/1$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(mora) }))
  await page.route(/\/api\/mascotas\/999$/, (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', headers: cors, body: '{}' }))
}

test('opens the detail of a pet from the catalog', async ({ page }) => {
  await mockApi(page)
  await page.goto('/catalogo.html')
  await page.getByRole('link', { name: 'Ver detalle de Mora' }).click()

  await expect(page).toHaveURL(/mascota\.html\?id=1$/)
  await expect(page.getByRole('heading', { name: 'Mora', level: 1 })).toBeVisible()
  await expect(page.getByTestId('pet-detail')).toContainText('Criollo')
  await expect(page.getByTestId('pet-detail')).toContainText('Huellitas · Bogotá')
  await expect(page.getByTestId('pet-detail')).toContainText('Disponible')
})

test('shows an error when the pet does not exist', async ({ page }) => {
  await mockApi(page)
  await page.goto('/mascota.html?id=999')

  await expect(page.getByRole('alert')).toContainText('La mascota no fue encontrada.')
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeHidden()
})

test('shows an error when the id is missing from the address', async ({ page }) => {
  await page.goto('/mascota.html')
  await expect(page.getByRole('alert')).toContainText('La mascota no fue encontrada.')
})

test('lets the user retry when the server fails', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/mascotas\/1$/, (route) => {
    calls += 1
    return calls === 1
      ? route.fulfill({ status: 500, contentType: 'application/json', headers: cors, body: '{}' })
      : route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(mora) })
  })
  await page.goto('/mascota.html?id=1')

  await expect(page.getByRole('alert')).toContainText('no pudo entregar')
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByTestId('pet-detail')).toContainText('Mora')
})
