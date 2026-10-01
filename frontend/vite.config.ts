import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// В docker-compose бэкенд доступен по имени сервиса (API_PROXY_TARGET задаётся
// там), локально — на localhost. Прокси делает API same-origin, поэтому
// httpOnly-cookie работает без CORS.
const target = process.env.API_PROXY_TARGET ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target, changeOrigin: true },
      '/socket.io': { target, ws: true, changeOrigin: true },
      '/admin': { target, changeOrigin: true },
    },
  },
})
