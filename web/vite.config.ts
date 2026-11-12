import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In dev, Vite proxies the API and the websocket to Nest (port 3000),
// so the front always talks to its own origin, exactly like in production.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
})
