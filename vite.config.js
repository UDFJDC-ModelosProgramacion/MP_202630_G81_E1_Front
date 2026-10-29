import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Multi-page app: each user story can ship its own page without touching the others.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        catalogo: resolve(import.meta.dirname, 'catalogo.html'),
        HU18: resolve(import.meta.dirname, 'HU18.html'),
        HU19: resolve(import.meta.dirname, 'HU19.html'),
        HU20: resolve(import.meta.dirname, 'HU20.html'),
        HU21: resolve(import.meta.dirname, 'HU21.html'),
      },
    },
  },
})
