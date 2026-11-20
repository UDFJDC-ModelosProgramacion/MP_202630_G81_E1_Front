import { expect, test } from '@playwright/test'
import { mockStoryApi } from './story-api'

test.beforeEach(async ({ page }) => {
  await page.goto('/HU18.html#solicitud')
})

test('shows validation feedback before accepting an incomplete request', async ({ page }) => {
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()

  await expect(page.getByRole('alert')).toContainText('Revisa los campos marcados')
  await expect(page.getByLabel('Nombre completo')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#fullName-error')).toHaveText('Escribe tu nombre completo.')
  await expect(page.getByLabel('Nombre completo')).toBeFocused()
})

test('submits and stores a complete request for the selected pet', async ({ page }) => {
  await page.getByLabel('Nombre completo').fill('Camila Rodríguez')
  await page.getByLabel('Correo electrónico').fill('camila@example.com')
  await page.getByLabel('Teléfono de contacto').fill('+57 300 123 4567')
  await page.getByLabel('Ciudad').fill('Bogotá')
  await page.getByLabel('Dirección').fill('Cra. 10 #20-30')
  await page.getByLabel('¿En qué tipo de vivienda vives?').selectOption('Apartamento')
  await page.getByLabel('¿Con quién vives?').selectOption('Con mi pareja')
  await page.getByLabel('¿Has convivido antes con mascotas?').selectOption('Sí, tuve mascotas antes')
  await page.getByLabel('¿Por qué quieres adoptar a Mora?').fill('Queremos darle un hogar lleno de amor.')
  await page.getByLabel(/Confirmo que la información es correcta/).check()
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()

  await expect(page.getByRole('heading', { name: 'Tu solicitud está en camino' })).toBeVisible()
  await expect(page.locator('#application-reference')).not.toBeEmpty()
  await expect(page.locator('#adoption-form')).toBeHidden()

  const applications = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('huellitas.adoptionApplications') ?? '[]'),
  )
  expect(applications).toHaveLength(1)
  expect(applications[0]).toMatchObject({
    petId: 'mora',
    petName: 'Mora',
    status: 'Pendiente',
    fullName: 'Camila Rodríguez',
    requestType: 'Adopción',
  })
})

test('lets the adopter return to the form after sending an adoption request', async ({ page }) => {
  await page.getByLabel('Nombre completo').fill('Camila Rodríguez')
  await page.getByLabel('Correo electrónico').fill('camila@example.com')
  await page.getByLabel('Teléfono de contacto').fill('3001234567')
  await page.getByLabel('Ciudad').fill('Bogotá')
  await page.getByLabel('Dirección').fill('Cra. 10 #20-30')
  await page.getByLabel('¿En qué tipo de vivienda vives?').selectOption('Casa')
  await page.getByLabel('¿Con quién vives?').selectOption('Vivo solo/a')
  await page.getByLabel('¿Has convivido antes con mascotas?').selectOption('No, sería mi primera vez')
  await page.getByLabel('¿Por qué quieres adoptar a Mora?').fill('Quiero darle un hogar permanente.')
  await page.getByLabel(/Confirmo que la información es correcta/).check()
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await page.getByRole('button', { name: 'Volver a la solicitud' }).click()

  await expect(page.locator('#adoption-form')).toBeVisible()
  await expect(page.getByLabel('Nombre completo')).toHaveValue('')
})

test('opens the mobile navigation when requested', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/HU18.html')
  const menu = page.locator('.menu-toggle')

  await menu.click()

  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await expect(menu).toHaveAttribute('aria-label', 'Cerrar navegación')
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'HU33 · Catálogo de mascotas' })).toBeVisible()

  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
})

test('keeps the complete story menu usable at tablet and desktop widths', async ({ page }) => {
  await page.goto('/HU18.html')

  for (const width of [768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    const menu = page.locator('.menu-toggle')
    await expect(menu).toBeVisible()
    await menu.click()
    const navigation = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(navigation).toBeVisible()
    await expect(navigation.getByRole('link', { name: 'HU33 · Catálogo de mascotas' })).toBeVisible()
    await menu.click()
  }
})

test('scrolls through the long mobile menu to the last story', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/HU18.html')
  await page.locator('.menu-toggle').click()

  const navigation = page.getByRole('navigation', { name: 'Navegación principal' })
  const dimensions = await navigation.evaluate((element) => ({
    hasVerticalOverflow: element.scrollHeight > element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
  }))
  expect(dimensions).toEqual({ hasVerticalOverflow: true, overflowY: 'auto' })

  const finalStory = navigation.getByRole('link', { name: 'HU33 · Catálogo de mascotas' })
  await finalStory.scrollIntoViewIfNeeded()
  await finalStory.click()
  await expect(page).toHaveURL(/HU33\.html$/)
})

test('shows the home page as the central navigation hub', async ({ page }) => {
  await mockStoryApi(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Una mirada puede cambiarlo todo/ })).toBeVisible()
  await page.getByRole('link', { name: 'Ver galería de Mora' }).click()
  await expect(page.getByRole('heading', { name: 'Mora' })).toBeVisible()
})

test('loads adoptable pets and their photos from the backend on the home page', async ({ page }) => {
  const pets = [
    { id: 41, nombre: 'Nube', especie: 'Perro', raza: 'Mestiza', edad: 4, estado: 'Disponible', refugio: { ciudad: 'Cali' } },
    { id: 42, nombre: 'Tango', especie: 'Gato', raza: 'Criollo', edad: 2, estado: 'Adoptado', refugio: { ciudad: 'Cali' } },
  ]
  await mockStoryApi(page, {
    pets,
    photos: {
      41: [{ id: 401, url: 'https://images.test/nube.jpg', descripcion: 'Retrato de Nube', principal: true, mascota: pets[0] }],
    },
  })
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Conocer a Nube' })).toHaveAttribute('href', './HU01.html#galeria/41')
  await expect(page.locator('#home-featured-caption')).toContainText('Nube, 4 años')
  await expect(page.locator('#home-featured-photo')).toHaveAttribute('src', 'https://images.test/nube.jpg')
  await expect(page.locator('.home-pet-row')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Nube' })).toBeVisible()
  await expect(page.locator('#home-view').getByText('Tango')).toHaveCount(0)
  await expect(page.locator('#home-view').getByText('Mora')).toHaveCount(0)
})

test('shows an empty state when the backend has no adoptable pets', async ({ page }) => {
  await mockStoryApi(page, { pets: [], photos: {} })
  await page.goto('/')

  await expect(page.locator('#home-data-feedback')).toHaveText(
    'No hay mascotas disponibles para adopción por el momento. Vuelve pronto.',
  )
  await expect(page.locator('.home-pet-row')).toHaveCount(0)
  await expect(page.locator('#home-featured-link')).toBeHidden()
})

test('reports home catalog failures and retries against the backend', async ({ page }) => {
  let catalogRequests = 0
  await page.route('http://localhost:8080/api/mascotas', (route) => {
    catalogRequests += 1
    return route.fulfill({
      status: catalogRequests === 1 ? 500 : 200,
      contentType: 'application/json',
      body: catalogRequests === 1
        ? '{}'
        : JSON.stringify([{ id: 51, nombre: 'Sol', especie: 'Perro', raza: 'Criolla', edad: 3, estado: 'Disponible' }]),
    })
  })
  await page.route('http://localhost:8080/api/mascotas/51/fotografias', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.goto('/')

  await expect(page.locator('#home-data-feedback')).toContainText('No pudimos completar la operación')
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: 'Sol' })).toBeVisible()
  expect(catalogRequests).toBe(2)
})

