import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In dev, Vite proxies the API to Nest (port 3000), so the front always
// talks to its own origin, exactly like in production.
export default defineConfig({
  plugins: [react()],
  build: {
    // public/assets/ is reserved for the team's pixel-art files.
    assetsDir: 'static',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
