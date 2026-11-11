import { expect, test } from '@playwright/test'

const updates = [
  {
    id: 'HU22-001',
    createdAt: '2026-10-26T10:00:00.000Z',
    targetType: 'mascota',
    targetId: 'MASC-001',
    title: 'Seguimiento de adaptación',
    description: 'La mascota se adapta favorablemente.',
  },
  {
    id: 'HU22-002',
    createdAt: '2026-10-27T10:00:00.000Z',
    targetType: 'adoptante',
    targetId: 'ADOP-001',
    title: 'Seguimiento del adoptante',
    description: 'Se realizó una llamada de seguimiento.',
  },
  {
    id: 'HU22-003',
    createdAt: '2026-10-28T10:00:00.000Z',
    targetType: 'mascota',
    targetId: 'MASC-002',
    title: 'Control veterinario',
    description: 'Se realizó el control veterinario.',
  },
]

test.beforeEach(async ({ page }) => {
  await page.goto('/HU23.html')
  await page.evaluate((records) => {
    localStorage.setItem('huellitas.actualizaciones', JSON.stringify(records))
  }, updates)
  await page.reload()
})

test('shows the complete update history', async ({ page }) => {
  await expect(page.getByRole('heading', {
    name: 'Seguimiento de adaptación',
  })).toBeVisible()

  await expect(page.getByRole('heading', {
    name: 'Seguimiento del adoptante',
  })).toBeVisible()

  await expect(page.getByRole('heading', {
    name: 'Control veterinario',
  })).toBeVisible()

  await expect(page.locator('#results-count')).toHaveText('3 registros')
})

test('filters updates by type', async ({ page }) => {
  await page.getByLabel('Tipo de actualización').selectOption('mascota')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()

  await expect(page.getByRole('heading', {
    name: 'Seguimiento de adaptación',
  })).toBeVisible()

  await expect(page.getByRole('heading', {
    name: 'Control veterinario',
  })).toBeVisible()

  await expect(page.getByRole('heading', {
    name: 'Seguimiento del adoptante',
  })).toHaveCount(0)

  await expect(page.locator('#results-count')).toHaveText('2 registros')
})

test('filters updates by a specific pet', async ({ page }) => {
  await page.getByLabel('Identificador de mascota').fill('MASC-001')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()

  await expect(page.getByRole('heading', {
    name: 'Seguimiento de adaptación',
  })).toBeVisible()

  await expect(page.getByRole('heading', {
    name: 'Control veterinario',
  })).toHaveCount(0)

  await expect(page.locator('#results-count')).toHaveText('1 registro')
})

test('filters updates by a specific adopter', async ({ page }) => {
  await page.getByLabel('Identificador de adoptante').fill('ADOP-001')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()

  await expect(page.getByRole('heading', {
    name: 'Seguimiento del adoptante',
  })).toBeVisible()

  await expect(page.getByRole('heading', {
    name: 'Seguimiento de adaptación',
  })).toHaveCount(0)

  await expect(page.locator('#results-count')).toHaveText('1 registro')
})

test('finds an individual update by its identifier', async ({ page }) => {
  await page.getByLabel('Identificador de la actualización').fill('HU22-002')
  await page.getByRole('button', { name: 'Buscar actualización' }).click()

  await expect(page.getByRole('status')).toHaveText('Actualización encontrada.')

  await expect(page.getByRole('heading', {
    name: 'Seguimiento del adoptante',
  })).toBeVisible()

  await expect(page.locator('#results-count')).toHaveText('1 registro')
})

test('shows an error when the requested update does not exist', async ({ page }) => {
  await page.getByLabel('Identificador de la actualización').fill('HU22-999')
  await page.getByRole('button', { name: 'Buscar actualización' }).click()

  await expect(page.getByRole('status')).toHaveText(
    'La actualización solicitada no fue encontrada.',
  )

  await expect(page.locator('#empty-state')).toBeVisible()
  await expect(page.locator('#results-count')).toHaveText('0 registros')
})

test('clears filters and restores the complete history', async ({ page }) => {
  await page.getByLabel('Identificador de mascota').fill('MASC-001')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()

  await page.getByRole('button', { name: 'Limpiar filtros' }).click()

  await expect(page.locator('#results-count')).toHaveText('3 registros')
  await expect(page.getByRole('heading', {
    name: 'Control veterinario',
  })).toBeVisible()
})

test('shows an empty state when there are no stored updates', async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem('huellitas.actualizaciones'))
  await page.reload()

  await expect(page.locator('#empty-state')).toBeVisible()
  await expect(page.locator('#results-count')).toHaveText('0 registros')
})