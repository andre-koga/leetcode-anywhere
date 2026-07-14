import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  worker: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AnyLeet',
        short_name: 'AnyLeet',
        description:
          'Offline-first coding practice: solve algorithm problems and run tests entirely in your browser.',
        theme_color: '#0b0c10',
        background_color: '#0b0c10',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Precache everything, including the Pyodide runtime (wasm/zip/mjs), so
        // the whole app - code execution included - works offline after first load.
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,ico,wasm,zip,json,woff2}'],
        maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
    }),
  ],
});
