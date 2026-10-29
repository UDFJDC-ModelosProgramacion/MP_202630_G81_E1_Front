import { expect, test, type Page } from '@playwright/test'

const API = '**/api/mascotas'

const refugio = { id: 7, nombre: 'Huellitas', ciudad: 'Bogotá' }
const mascotas = [
  { id: 1, nombre: 'Mora', especie: 'Perro', raza: 'Criollo', edad: 3, sexo: 'Hembra', tamano: 'Mediano', temperamento: 'Juguetona', estado: 'Disponible', refugio },
  { id: 2, nombre: 'Félix', especie: 'Gato', raza: 'Siamés', edad: 1, sexo: 'Macho', tamano: 'Pequeño', estado: 'Adoptado', refugio },
  { id: 3, nombre: 'Rocky', especie: 'Perro', raza: 'Labrador', edad: 5, sexo: 'Macho', tamano: 'Grande', estado: 'En proceso de adopcion', refugio },
]

async function mockPets(page: Page, body: unknown, status = 200) {
  await page.route(API, (route) => route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  }))
}

test('shows every pet returned by the API', async ({ page }) => {
  await mockPets(page, mascotas)
  await page.goto('/HU33.html')

  await expect(page.getByRole('heading', { name: 'Catálogo de mascotas', level: 1 })).toBeVisible()
  await expect(page.getByTestId('pet-card')).toHaveCount(3)
  await expect(page.getByRole('status').filter({ hasText: 'Mostrando 3 mascotas' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mora' })).toBeVisible()
  await expect(page.getByText('Criollo · 3 años · Hembra · Mediano')).toBeVisible()
  await expect(page.getByTestId('pet-card').getByText('En proceso de adopción')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Información del catálogo' })).toBeVisible()
})

test('shows a loading message while the API answers', async ({ page }) => {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route(API, async (route) => {
    await gate
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' })
  })
  await page.goto('/HU33.html')

  await expect(page.getByText('Cargando mascotas')).toBeVisible()
  release()
  await expect(page.getByText('Cargando mascotas')).toBeHidden()
})

test('filters by species, status and search text, and can clear the filters', async ({ page }) => {
  await mockPets(page, mascotas)
  await page.goto('/HU33.html')
  await expect(page.getByTestId('pet-card')).toHaveCount(3)

  await page.getByLabel('Especie').selectOption('Gato')
  await expect(page.getByTestId('pet-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Félix' })).toBeVisible()

  await page.getByLabel('Especie').selectOption('todos')
  await page.getByLabel('Estado').selectOption('Disponible')
  await expect(page.getByTestId('pet-card')).toHaveCount(1)

  await page.getByLabel('Estado').selectOption('todos')
  await page.getByLabel('Buscar por nombre o raza').fill('labrador')
  await expect(page.getByTestId('pet-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Rocky' })).toBeVisible()

  await page.getByLabel('Buscar por nombre o raza').fill('zzz')
  await expect(page.getByText('No encontramos mascotas con esos filtros.')).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await expect(page.getByTestId('pet-card')).toHaveCount(3)
  await expect(page.getByLabel('Buscar por nombre o raza')).toBeFocused()
})

test('shows an empty state when there are no pets', async ({ page }) => {
  await mockPets(page, [])
  await page.goto('/HU33.html')

  await expect(page.getByText('Aún no hay mascotas registradas. Vuelve pronto.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Limpiar filtros' })).toBeHidden()
  await expect(page.getByTestId('pet-card')).toHaveCount(0)
})

test('shows an error and lets the user retry', async ({ page }) => {
  let calls = 0
  await page.route(API, (route) => {
    calls += 1
    const ok = calls > 1
    return route.fulfill({
      status: ok ? 200 : 500,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: ok ? JSON.stringify(mascotas) : '{}',
    })
  })
  await page.goto('/HU33.html')

  await expect(page.getByRole('alert')).toContainText('no pudo entregar el catálogo')
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByTestId('pet-card')).toHaveCount(3)
  await expect(page.getByRole('alert')).toBeHidden()
})

test('shows an error when the server cannot be reached', async ({ page }) => {
  await page.route(API, (route) => route.abort('connectionrefused'))
  await page.goto('/HU33.html')

  await expect(page.getByRole('alert')).toContainText('No pudimos conectar con el servidor')
})

test('can be used with the keyboard only', async ({ page }) => {
  await mockPets(page, mascotas)
  await page.goto('/HU33.html')
  await expect(page.getByTestId('pet-card')).toHaveCount(3)

  await page.getByLabel('Buscar por nombre o raza').focus()
  await page.keyboard.type('mora')
  await expect(page.getByTestId('pet-card')).toHaveCount(1)
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Especie')).toBeFocused()
})
