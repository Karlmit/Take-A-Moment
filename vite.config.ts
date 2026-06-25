import { join } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = process.cwd()

export default defineConfig({
  root: join(root, 'src'),
  clearScreen: false,
  build: {
    outDir: join(root, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        overlay: join(root, 'src/overlay/index.html'),
        settings: join(root, 'src/settings/index.html'),
      },
    },
  },
  server: {
    strictPort: true,
  },
  plugins: [react()],
})
