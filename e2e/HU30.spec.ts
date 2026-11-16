import { expect, test, type Page } from '@playwright/test'

const datos = {
  nombre: 'Huellitas',
  ciudad: 'Bogotá',
  direccion: 'Calle 1 # 2-3',
  telefono: '3001234567',
  correo: 'contacto@huellitas.co',
  descripcion: 'Refugio de perros y gatos',
}
const cors = { 'access-control-allow-origin': '*' }
const json = (status: number, body: unknown) => ({
  status,
  contentType: 'application/json',
  headers: cors,
  body: JSON.stringify(body),
})

async function fillForm(page: Page, values: Record<string, string>) {
  await page.getByLabel('Nombre').fill(values.nombre)
  await page.getByLabel('Ciudad').fill(values.ciudad)
  await page.getByLabel('Dirección').fill(values.direccion)
  await page.getByLabel('Teléfono').fill(values.telefono)
  await page.getByLabel('Correo').fill(values.correo)
  await page.getByLabel('Descripción').fill(values.descripcion)
}

test('registers a shelter and offers a link to edit it', async ({ page }) => {
  let sent: unknown = null
  await page.route(/\/api\/refugios$/, (route) => {
    sent = route.request().postDataJSON()
    return route.fulfill(json(201, { id: 12, ...datos }))
  })
  await page.goto('/HU30.html')
  await expect(page.getByRole('heading', { name: 'Gestionar refugios', level: 1 })).toBeVisible()

  await fillForm(page, datos)
  await page.getByRole('button', { name: /Guardar refugio/ }).click()

  await expect(page.getByText('Refugio registrado correctamente.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar este refugio' })).toHaveAttribute('href', './HU30.html?id=12')
  expect(sent).toEqual(datos)
  await expect(page.getByLabel('Nombre')).toHaveValue('')
})

test('rejects empty required fields without calling the API', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/refugios/, (route) => { calls += 1; return route.fulfill(json(201, {})) })
  await page.goto('/HU30.html')

  await page.getByRole('button', { name: /Guardar refugio/ }).click()

  await expect(page.getByText('El nombre es obligatorio.')).toBeVisible()
  await expect(page.getByText('La descripción es obligatoria.')).toBeVisible()
  await expect(page.getByLabel('Nombre')).toBeFocused()
  await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true')
  expect(calls).toBe(0)
})

test('rejects an invalid email', async ({ page }) => {
  await page.goto('/HU30.html')
  await fillForm(page, { ...datos, correo: 'sin-arroba' })
  await page.getByRole('button', { name: /Guardar refugio/ }).click()

  await expect(page.getByText(/Ingresa un correo válido/)).toBeVisible()
  await expect(page.getByLabel('Correo')).toBeFocused()
})

test('loads an existing shelter and saves the changes', async ({ page }) => {
  let sent: unknown = null
  await page.route(/\/api\/refugios\/5$/, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(json(200, { id: 5, ...datos }))
    sent = route.request().postDataJSON()
    return route.fulfill(json(200, { id: 5, ...datos, ciudad: 'Cali' }))
  })
  await page.goto('/HU30.html?id=5')

  await expect(page.getByRole('heading', { name: 'Gestionar refugios', level: 1 })).toBeVisible()
  await expect(page.getByLabel('Nombre')).toHaveValue('Huellitas')
  await page.getByLabel('Ciudad').fill('Cali')
  await page.getByRole('button', { name: /Guardar refugio/ }).click()

  await expect(page.getByText('Refugio actualizado correctamente.')).toBeVisible()
  expect(sent).toEqual({ ...datos, ciudad: 'Cali' })
  await expect(page.getByLabel('Ciudad')).toHaveValue('Cali')
})

test('shows a not found error when the shelter to edit does not exist', async ({ page }) => {
  await page.route(/\/api\/refugios\/999$/, (route) => route.fulfill(json(404, {})))
  await page.goto('/HU30.html?id=999')

  await expect(page.getByRole('alert')).toContainText('El refugio no fue encontrado.')
  await expect(page.getByLabel('Nombre')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeHidden()
})

test('shows a not found error when the id in the address is invalid', async ({ page }) => {
  await page.goto('/HU30.html?id=abc')
  await expect(page.getByRole('alert')).toContainText('El refugio no fue encontrado.')
})

test('shows a not found error when the shelter disappears before saving', async ({ page }) => {
  await page.route(/\/api\/refugios\/5$/, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill(json(200, { id: 5, ...datos }))
      : route.fulfill(json(404, {})))
  await page.goto('/HU30.html?id=5')
  await expect(page.getByLabel('Nombre')).toHaveValue('Huellitas')

  await page.getByRole('button', { name: /Guardar refugio/ }).click()

  await expect(page.getByRole('alert')).toContainText('El refugio no fue encontrado.')
})

test('shows the server message when it rejects the data', async ({ page }) => {
  await page.route(/\/api\/refugios$/, (route) => route.fulfill(json(400, { apierror: { message: 'Ya existe un refugio con ese nombre' } })))
  await page.goto('/HU30.html')
  await fillForm(page, datos)
  await page.getByRole('button', { name: /Guardar refugio/ }).click()

  await expect(page.getByRole('alert')).toContainText('Ya existe un refugio con ese nombre')
  await expect(page.getByLabel('Nombre')).toHaveValue('Huellitas')
})

test('shows an error and lets the user retry loading', async ({ page }) => {
  let calls = 0
  await page.route(/\/api\/refugios\/5$/, (route) => {
    calls += 1
    return calls === 1 ? route.fulfill(json(500, {})) : route.fulfill(json(200, { id: 5, ...datos }))
  })
  await page.goto('/HU30.html?id=5')

  await expect(page.getByRole('alert')).toContainText('no pudo procesar el refugio')
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByLabel('Nombre')).toHaveValue('Huellitas')
  await expect(page.getByRole('alert')).toBeHidden()
})

test('shows an error when the server cannot be reached', async ({ page }) => {
  await page.route(/\/api\/refugios$/, (route) => route.abort('connectionrefused'))
  await page.goto('/HU30.html')
  await fillForm(page, datos)
  await page.getByRole('button', { name: /Guardar refugio/ }).click()

  await expect(page.getByRole('alert')).toContainText('No pudimos conectar con el servidor')
})

test('can be completed with the keyboard only', async ({ page }) => {
  await page.route(/\/api\/refugios$/, (route) => route.fulfill(json(201, { id: 1, ...datos })))
  await page.goto('/HU30.html')

  await page.getByLabel('Nombre').focus()
  await page.keyboard.type(datos.nombre)
  await page.keyboard.press('Tab')
  await page.keyboard.type(datos.ciudad)
  await page.keyboard.press('Tab')
  await page.keyboard.type(datos.direccion)
  await page.keyboard.press('Tab')
  await page.keyboard.type(datos.telefono)
  await page.keyboard.press('Tab')
  await page.keyboard.type(datos.correo)
  await page.keyboard.press('Tab')
  await page.keyboard.type(datos.descripcion)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /Guardar refugio/ })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.getByText('Refugio registrado correctamente.')).toBeVisible()
})

test('opens the shelter to edit from its number', async ({ page }) => {
  await page.route(/\/api\/refugios\/5$/, (route) => route.fulfill(json(200, { id: 5, ...datos })))
  await page.goto('/HU30.html')

  await page.getByLabel('Número de refugio').fill('5')
  await page.getByRole('button', { name: 'Editar refugio' }).click()

  await expect(page).toHaveURL(/HU30\.html\?id=5$/)
  await expect(page.getByLabel('Nombre')).toHaveValue('Huellitas')
})
