// e2e/flujo-tareas.spec.ts
import { test, expect } from '@playwright/test'

test('un usuario inicia sesion, crea una tarea y la ve en la lista', async ({ page }) => {
  // --- Simulamos el backend (Express + PostgreSQL) ---
  // Playwright intercepta las llamadas a localhost:3000 y responde por el.
  // Asi la prueba verifica TODO el frontend sin depender de la base de datos.

  // 1) POST /login -> devuelve un token falso
  await page.route('**/login', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        message: 'Login correcto',
        token: 'token-de-prueba',
        user: { name: 'Sergio' },
      },
    })
  })

  // 2) /tasks -> el GET devuelve lista vacia, el POST devuelve la tarea creada
  await page.route('**/tasks', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: [] })
      return
    }
    const cuerpo = route.request().postDataJSON()
    await route.fulfill({
      status: 201,
      json: {
        id: 1,
        text: cuerpo.text,
        priority: cuerpo.priority,
        completed: false,
      },
    })
  })

  // --- FLUJO FELIZ ---

  // Paso 1: entrar a la aplicacion (aparece la pantalla de login)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()

  // Paso 2: iniciar sesion
  await page.getByPlaceholder('Email').fill('sergio@maestria.com')
  await page.getByPlaceholder('Contraseña').fill('123456')
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Paso 3: ya dentro, el gestor de tareas esta visible
  await expect(page.getByPlaceholder('Escribe una nueva tarea')).toBeVisible()

  // Paso 4: crear una tarea
  await page.getByPlaceholder('Escribe una nueva tarea').fill('Comprar pan')
  await page.getByRole('button', { name: 'Agregar' }).click()

  // Paso 5: verla en la lista
  await expect(page.getByText('Comprar pan')).toBeVisible()
})
