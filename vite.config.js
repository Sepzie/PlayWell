import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Use system.js format instead of ES modules for Electron compatibility
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        tray: path.resolve(__dirname, 'tray-menu.html'),
      },
      output: {
        format: 'es', // Keep ES format but...
        manualChunks: undefined, // Disable code splitting
      }
    },
    // Keep CSS per entry to avoid cross-page style bleed
    cssCodeSplit: true,
    // Ensure proper module resolution
    modulePreload: false,
  },
  server: {
    port: 5173,
    strictPort: true
  }
});


