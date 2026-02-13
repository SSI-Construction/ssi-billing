import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // GitHub Pages needs /repo-name/ base; Electron needs ./
  base: mode === 'production' && process.env.GITHUB_ACTIONS ? '/ssi-billing/' : './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}))
