import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'https://8afbu10k60e64svm-8188.container.x-gpu.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
      '/ai-video': {
        target: 'https://8n0vf44x64b58itu-8188.container.x-gpu.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ai-video/, ''),
      },
    },
  },
})
