import type { Page } from '@playwright/test'

type Reply = [number, unknown]
type Routes = Record<string, Reply | (() => Reply)>

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
}

// Simula el back-end: las claves tienen la forma "MÉTODO /ruta", por ejemplo "GET /vacunas".
export async function mockApi(page: Page, routes: Routes) {
  await page.route(/^http:\/\/localhost:8080\/api\//, async (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS })
      return
    }
    const path = new URL(request.url()).pathname.replace(/^\/api/, '')
    const hit = routes[`${request.method()} ${path}`]
    const [status, body]: Reply = typeof hit === 'function'
      ? hit()
      : hit ?? [404, { apierror: { message: `Sin ruta ${path}` } }]
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: CORS,
      body: status === 204 ? undefined : JSON.stringify(body),
    })
  })
}
