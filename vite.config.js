import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/ppt': {
        target: 'http://localhost:4000',
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
