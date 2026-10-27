
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        actualizaciones: resolve(process.cwd(), 'actualizaciones.html'),
      },
    },
  },
})
