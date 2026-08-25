import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 开发后端地址：默认 8081（本机开发后端，自动用测试库 maridiancareer-test）。
  // 8080 是本机生产服务（正式库），开发时不要指向它。
  // 可在 .env 中用 VITE_DEV_PROXY_TARGET 覆盖。
  const env = loadEnv(mode, process.cwd(), '')
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8081'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Strip Origin to bypass backend CSRF check for local dev
              proxyReq.removeHeader('Origin');
              proxyReq.removeHeader('Referer');
            });
          },
        },
        '/uploads': {
          target: devProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
