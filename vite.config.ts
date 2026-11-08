import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env, .env.local и т.д. — читаем тем же механизмом, что и клиент
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // фронтенд всегда ходит в /api, а куда именно — решает эта настройка
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // бэкенд может отдавать /api/... или /... — при необходимости раскомментируйте
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
