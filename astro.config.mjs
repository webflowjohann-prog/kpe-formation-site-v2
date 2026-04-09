import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import netlify from '@astrojs/netlify'
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  output: 'server',
  adapter: isDev
    ? node({ mode: 'standalone' })
    : netlify({ imageCDN: false }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: { port: 4321 },
})
