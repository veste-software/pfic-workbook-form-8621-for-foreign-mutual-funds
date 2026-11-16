import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  const origin = (site ?? new URL('http://localhost:4321')).origin;
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}${base}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
