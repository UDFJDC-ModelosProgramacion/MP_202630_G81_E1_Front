import { expect, test, type Page } from '@playwright/test'

const API = '**/api/**'

const pets = [
  { id: 1, nombre: 'Mora', especie: 'Perro' },
  { id: 2, nombre: 'Félix', especie: 'Gato' },
]

const adopters = [
  { id: 2, nombre: 'Ana', apellido: 'Pérez' },
]

const initialReviews = [
  {
    id: 10,
    calificacion: 4,
    comentario: 'Muy buena experiencia',
    fecha: '2026-10-26',
    mascota: { id: 1, nombre: 'Mora' },
    adoptante: { id: 2, nombre: 'Ana', apellido: 'Pérez' },
  },
]

async function mockApi(page: Page) {
  const reviews = structuredClone(initialReviews)

  await page.route(API, async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()

    if (url.pathname.endsWith('/mascotas')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pets),
      })
    }

    if (url.pathname.endsWith('/adoptantes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adopters),
      })
    }

    if (url.pathname.endsWith('/resenas') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reviews),
      })
    }

    if (url.pathname.endsWith('/resenas') && method === 'POST') {
      const body = route.request().postDataJSON()
      const created = {
        id: 20,
        calificacion: body.calificacion,
        comentario: body.comentario,
        fecha: body.fecha,
        mascota: {
          id: body.mascota.id,
          nombre: pets.find((pet) => pet.id === body.mascota.id)?.nombre,
        },
        adoptante: body.adoptante
          ? {
              id: body.adoptante.id,
              nombre: 'Ana',
              apellido: 'Pérez',
            }
          : null,
      }

      reviews.push(created)

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      })
    }

    if (url.pathname.match(/\/resenas\/\d+$/) && method === 'PUT') {
      const id = Number(url.pathname.split('/').pop())
      const body = route.request().postDataJSON()
      const index = reviews.findIndex((review) => review.id === id)

      if (index === -1) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            apiError: { message: 'La reseña no existe.' },
          }),
        })
      }

      reviews[index] = {
        ...reviews[index],
        calificacion: body.calificacion,
        comentario: body.comentario,
        fecha: body.fecha,
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reviews[index]),
      })
    }

    return route.fulfill({ status: 404, body: '{}' })
  })
}

test('shows pets, adopters and registered reviews', async ({ page }) => {
  await mockApi(page)
  await page.goto('/HU24.html')

  await expect(page.getByRole('heading', {
    name: 'Reseñas de mascotas',
  })).toBeVisible()

  await expect(page.getByLabel('Mascota *')).toContainText('Mora')
  await expect(page.getByLabel('Adoptante (opcional)')).toContainText('Ana Pérez')
  await expect(page.getByTestId('review-card')).toHaveCount(1)
  await expect(page.getByText('Muy buena experiencia')).toBeVisible()
})

test('publishes a review without an adopter', async ({ page }) => {
  await mockApi(page)
  await page.goto('/HU24.html')

  await page.getByLabel('Mascota *').selectOption('2')
  await page.getByLabel('Calificación *').selectOption('5')
  await page.getByLabel('Comentario *').fill('Félix es una mascota maravillosa.')

  await page.getByRole('button', { name: 'Publicar reseña' }).click()

  await expect(page.getByRole('alert')).toContainText(
    'La reseña se publicó correctamente.',
  )

  await expect(page.getByTestId('review-card')).toHaveCount(2)
  await expect(page.getByText('Félix es una mascota maravillosa.')).toBeVisible()
})

test('shows the backend validation error when publishing fails', async ({ page }) => {
  await page.route(API, async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()

    if (url.pathname.endsWith('/mascotas')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pets),
      })
    }

    if (url.pathname.endsWith('/adoptantes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adopters),
      })
    }

    if (url.pathname.endsWith('/resenas') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    }

    if (url.pathname.endsWith('/resenas') && method === 'POST') {
      return route.fulfill({
        status: 412,
        contentType: 'application/json',
        body: JSON.stringify({
          apiError: {
            message: 'La calificación de la reseña debe estar entre 1 y 5',
          },
        }),
      })
    }

    return route.fulfill({ status: 404, body: '{}' })
  })

  await page.goto('/HU24.html')
  await page.getByLabel('Mascota *').selectOption('1')
  await page.getByLabel('Calificación *').selectOption('5')
  await page.getByLabel('Comentario *').fill('Una experiencia excelente.')

  await page.getByRole('button', { name: 'Publicar reseña' }).click()

  await expect(page.getByRole('alert')).toContainText(
    'La calificación de la reseña debe estar entre 1 y 5',
  )
})

test('edits the rating and comment of an existing review', async ({ page }) => {
  await mockApi(page)
  await page.goto('/HU24.html')

  await page.getByRole('button', { name: 'Editar reseña' }).click()

  await expect(page.getByRole('heading', {
    name: 'Editar reseña #10',
  })).toBeVisible()

  await expect(page.getByLabel('Mascota *')).toBeDisabled()
  await expect(page.getByLabel('Fecha *')).toBeDisabled()

  await page.getByLabel('Calificación *').selectOption('5')
  await page.getByLabel('Comentario *').fill('Ahora mi experiencia fue excelente.')

  await page.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect(page.getByRole('alert')).toContainText(
    'La reseña se actualizó correctamente.',
  )

  await expect(page.getByText('Ahora mi experiencia fue excelente.')).toBeVisible()
  await expect(page.getByTestId('review-card')).toHaveCount(1)
})