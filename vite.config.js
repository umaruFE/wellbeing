import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { workbenchCdnAssets } from './dev/workbench-cdn-assets.mjs'
export default defineConfig({
  plugins: [
    react(),
    workbenchCdnAssets(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['star.svg'],
      manifest: {
        name: '小星星',
        short_name: '小星星',
        description: '小星星课程与绘本创作工作台',
        theme_color: '#7053c1',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        lang: 'zh-CN',
        icons: [
          { src: '/star.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: ['workbench-v6/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/workbench-v6\//],
        // 增大缓存文件上限到 6 MiB（默认 2 MiB 不够用）
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
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
