// playwright.config.ts
import { defineConfig } from '@playwright/test'

const enCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',

  // En CI el reporter "list" imprime cada prueba a medida que corre, para ver
  // en el log de Actions exactamente en que paso va.
  reporter: enCI ? [['list'], ['html', { open: 'never' }]] : 'html',

  use: {
    baseURL: 'http://localhost:5173',
  },

  // En CI el frontend lo levanta el propio workflow, en segundo plano y con su
  // salida redirigida. Asi Playwright no es dueno de ese proceso y el step
  // termina apenas pasan las pruebas, en vez de quedarse esperando a que el
  // servidor cierre sus tuberias.
  // En local se mantiene la comodidad de que Playwright lo levante solo.
  webServer: enCI
    ? undefined
    : {
        command: 'pnpm exec vite --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'ignore',
      },
})
