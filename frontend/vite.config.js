import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // escuta 0.0.0.0 no contêiner
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,    // polling para volumes no Windows
      interval: 300,
    },
    hmr: {
      host: '127.0.0.1',   // cliente se conecta ao host local
      clientPort: 5173,
      protocol: 'ws',
    },
  },
})
