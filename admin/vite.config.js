import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy avoids CORS setup on the backend during local dev.
    proxy: {
      '/auth': 'http://localhost:4000',
      '/content': 'http://localhost:4000',
      '/tokens': 'http://localhost:4000',
      '/media': 'http://localhost:4000',
    },
  },
});
