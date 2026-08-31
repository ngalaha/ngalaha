import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'MA2D Photos Chantier',
        short_name: 'MA2D Photos',
        description: "Gestion des photos de chantier MA2D Construction avec envoi automatique vers Google Drive.",
        theme_color: '#112233',
        background_color: '#112233',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Never cache Google APIs: uploads must always hit the network live.
        navigateFallbackDenylist: [/^\/oauth2/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
