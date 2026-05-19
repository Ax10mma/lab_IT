import { defineConfig } from 'vite'

export default defineConfig({
  root: 'scr',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  }
})