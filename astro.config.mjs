// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Previews live on GitHub Pages under /<repo>/; the workflow sets SITE_URL and SITE_BASE.
// A local build has no base (/). Production (Cloudflare Pages) sets SITE_URL to the real domain.
const site = process.env.SITE_URL || 'http://localhost:4321';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [preact(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
