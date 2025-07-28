import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
  

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.NODE_ENV === 'production' ? '/trading/' : '/',
  server: {
    proxy: {
      '/api/csfloat': {
        target: 'https://csfloat.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/csfloat/, '/api/v1'),
        headers: {
          'Authorization': 'XxCdChPCf4DnY-TXRpgOTPthR21NGxDk'
        }
      }
    }
  }
})
