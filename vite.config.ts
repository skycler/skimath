import { defineConfig } from 'vite';

export default defineConfig({
  // For GitHub Pages: set to '/<repo-name>/' or '/' for custom domain
  base: '/skimath/',
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600 // Three.js is large, this is expected for a 3D game
  }
});
