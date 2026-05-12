import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'scr',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  }
})