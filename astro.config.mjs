import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://businessleaders.in',
  trailingSlash: 'always',
  integrations: [
    tailwind(),
    sitemap({
      changefreq: 'daily',
      priority: 0.7,
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  build: {
    format: 'directory',
  },
});
