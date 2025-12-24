import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Use system.js format instead of ES modules for Electron compatibility
    rollupOptions: {
      output: {
        format: 'es', // Keep ES format but...
        manualChunks: undefined, // Disable code splitting
      }
    },
    // Generate a single bundle
    cssCodeSplit: false,
    // Ensure proper module resolution
    modulePreload: false,
  },
  server: {
    port: 5173,
    strictPort: true
  }
});


