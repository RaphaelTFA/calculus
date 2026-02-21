import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // Ngăn chặn việc tạo ra file .map
    minify: 'esbuild', // Nén code để biến các file jsx thành js hỗn độn
    rollupOptions: {
      output: {
        manualChunks: undefined, // Gom nhóm các file lại
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
