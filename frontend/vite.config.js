import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    // allowedHosts: ['republicans-terminology-generic-wave.trycloudflare.com']
    allowedHosts: ['.trycloudflare.com'],
    hmr: {
      clientPort: 443
    }
  }
})
