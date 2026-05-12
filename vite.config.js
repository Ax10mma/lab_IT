import { defineConfig } from 'vite'

export default defineConfig({
  root: 'scr',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './scr/3d_tuning.html'
    }
  }
})