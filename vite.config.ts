import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Servi par GitHub Pages sous https://<compte>.github.io/notationsdesvins/
export default defineConfig({
  base: "/notationsdesvins/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Nos Vins',
        short_name: 'Nos Vins',
        description: 'Carnet de dégustation partagé entre amis, hors ligne',
        theme_color: '#7b1e3a',
        background_color: '#faf7f2',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Photos d'étiquettes publiées : gardées en cache pour l'usage hors ligne.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*\/photos\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'label-photos',
              expiration: { maxEntries: 500 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
