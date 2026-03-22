import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Netlify uses root '/'; Electron needs './'
  base: mode === 'electron' ? './' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}))
