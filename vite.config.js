import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const django = env.CAFETO_DJANGO_URL || 'http://127.0.0.1:8000'

  // Por defecto apiClient conecta por CORS directo (VITE_API_URL o http://localhost:8000/api/movil).
  // Este proxy queda como respaldo opcional si se define VITE_USAR_PROXY=true en .env.local.
  const proxy = {
    '/api': { target: django, changeOrigin: true },
    '/media': { target: django, changeOrigin: true },
  }

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  }
})
