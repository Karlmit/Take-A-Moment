import { join } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const root = process.cwd()

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: join(root, 'electron/main.ts'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: join(root, 'electron/preload.ts'),
      },
    },
  },
  renderer: {
    root: join(root, 'src'),
    build: {
      rollupOptions: {
        input: {
          overlay: join(root, 'src/overlay/index.html'),
          settings: join(root, 'src/settings/index.html'),
        },
      },
    },
    plugins: [react()],
  },
})
