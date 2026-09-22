// playwright.config.ts
import { defineConfig } from '@playwright/test'

const enCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',

  // En CI el reporter "list" imprime cada prueba a medida que corre: si algo se
  // traba, el log de Actions muestra en que paso fue. El HTML se sigue generando
  // para subirlo como artifact, pero sin intentar abrirlo en un navegador.
  reporter: enCI ? [['list'], ['html', { open: 'never' }]] : 'html',

  use: {
    baseURL: 'http://localhost:5173',
  },

  webServer: {
    // --strictPort: si el 5173 estuviera ocupado, Vite falla en vez de moverse
    // al 5174 en silencio (ahi Playwright esperaria en el 5173 para siempre).
    command: 'pnpm exec vite --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !enCI,
    timeout: 120_000,

    // stdout: 'ignore' es lo que destraba el job. Con la salida del servidor
    // conectada al step, el proceso de Vite mantiene abierta la tuberia y el
    // step nunca termina, aunque las pruebas ya hayan pasado.
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
