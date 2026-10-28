import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Multi-page app: each user story can ship its own page without touching the others.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        catalogo: resolve(import.meta.dirname, 'catalogo.html'),
      },
    },
  },
})
