// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Vitest NO debe tocar la carpeta e2e: esas pruebas son de Playwright.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', 'backend/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',        // solo arranca React, no tiene logica que probar
        'src/test/**',         // el setup de las pruebas
        '**/*.d.ts',           // declaraciones de tipos, no se ejecutan
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
})
