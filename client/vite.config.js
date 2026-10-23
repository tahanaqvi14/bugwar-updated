import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Put big libraries in their own files: smaller chunks, and browsers can cache them between deploys
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          apollo: ['@apollo/client', 'graphql'],
          realtime: ['socket.io-client', 'gsap', 'zustand', 'react-toastify'],
        },
      },
    },
  },
})
