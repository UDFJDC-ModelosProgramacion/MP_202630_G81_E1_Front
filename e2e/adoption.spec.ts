import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/#solicitud')
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
  const menu = page.locator('.menu-toggle')

  await menu.click()

  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await expect(menu).toHaveAttribute('aria-label', 'Cerrar navegación')
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()

  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
})

test('shows the home page as the central navigation hub', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Una mirada puede cambiarlo todo/ })).toBeVisible()
  await page.getByRole('link', { name: 'Ver galería de Mora' }).click()
  await expect(page.getByRole('heading', { name: 'Mora' })).toBeVisible()
})

test('shows every photo and marks the main photo first', async ({ page }) => {
  await page.goto('/#galeria/mora')

  const photos = page.locator('.gallery-photo')
  await expect(photos).toHaveCount(3)
  await expect(photos.first()).toHaveClass(/gallery-photo-main/)
  await expect(photos.first()).toContainText('Fotografía principal')
})

test('shows an informative empty state when the pet has no photos', async ({ page }) => {
  await page.goto('/#galeria/luna')
  await expect(page.getByRole('heading', { name: 'Aún no hay fotografías disponibles' })).toBeVisible()
})

test('shows an error when the requested pet does not exist', async ({ page }) => {
  await page.goto('/#galeria/inexistente')
  await expect(page.getByRole('alert')).toContainText('No encontramos a esta mascota')
})
