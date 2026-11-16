import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { defineConfig } from 'vite'

const storyPages = readdirSync(import.meta.dirname)
  .filter((file) => /^HU\d+\.html$/.test(file))
  .sort()

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(storyPages.map((file) => [
          file.slice(0, -'.html'.length),
          resolve(import.meta.dirname, file),
        ])),
      },
    },
  },
})
