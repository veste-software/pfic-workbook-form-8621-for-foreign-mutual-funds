// Run after `npm run build`. Exits 1 with a list of problems.
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const problems = [];
const dist = new URL('../dist/', import.meta.url);
const pagesDir = new URL('../src/pages/', import.meta.url);
const legalDir = new URL('../src/content/legal/', import.meta.url);

const slugs = readdirSync(pagesDir)
  .filter((f) => f.endsWith('.astro') && f !== '404.astro')
  .map((f) => f.replace(/\.astro$/, ''))
  .map((s) => (s === 'index' ? '' : s));

const html = (slug) => {
  const p = new URL(slug ? `${slug}/index.html` : 'index.html', dist);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};

const sitemap = existsSync(new URL('sitemap-0.xml', dist)) ? readFileSync(new URL('sitemap-0.xml', dist), 'utf8') : '';
if (!sitemap) problems.push('dist/sitemap-0.xml is missing');

const DISCLAIMER = 'Prepared with PFIC Workbook from figures you entered. This is not tax advice. Check it or have a preparer check it.';
const NEEDS_DISCLAIMER = ['', 'pricing', 'how-it-works', 'form-8621-mark-to-market', 'do-i-need-to-file-form-8621', 'form-8621-indian-mutual-funds-sip', 'form-8621-ucits-etf', 'pfic-excess-distribution-calculator'];

for (const s of slugs) {
  const h = html(s);
  if (h === null) {
    problems.push(`/${s} was not built`);
    continue;
  }
  const loc = new RegExp(`<loc>[^<]*/${s}${s ? '/?' : ''}</loc>`);
  if (!['impressum', 'datenschutz'].includes(s) && sitemap && !loc.test(sitemap)) problems.push(`/${s} is not in the sitemap`);
  if (NEEDS_DISCLAIMER.includes(s) && !h.includes(DISCLAIMER) && s !== '') problems.push(`/${s} lacks the disclaimer`);
  // The owner's legal texts are shown unchanged and are not checked for wording.
  if (!['impressum', 'datenschutz'].includes(s) && /IRS-approved|CPA-reviewed|guaranteed/i.test(h)) problems.push(`/${s} contains a banned claim`);
}

const legal = readdirSync(legalDir).filter((f) => /^(impressum|datenschutz)\.en\.html$/.test(f));
for (const f of legal) {
  const slug = f.split('.')[0];
  const h = html(slug);
  if (h !== null && !h.includes(readFileSync(new URL(f, legalDir), 'utf8').trim())) problems.push(`/${slug} does not hold ${f} unchanged`);
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log(`check-dist: ${slugs.length} pages ok`);
