import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://formation-kinesiologie.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin/') &&
        !page.includes('/espace-eleve/') &&
        !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
    react()
  ],
  build: {
    assets: '_assets'
  },
  output: 'static'
});
