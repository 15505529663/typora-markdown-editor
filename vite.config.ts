import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    strictPort: true,
    hmr: {
      // 如果你使用的是 cpolar 的 https 链接，请确保 clientPort 为 443
      // 如果使用的是 http 链接，可以将其改为 80 或者删除此行
      clientPort: 443, 
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
