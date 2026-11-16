# PFIC Workbook: Form 8621 for foreign mutual funds and ETFs, lot by lot

Built by an automated studio. Read `SPEC.md` (what and why), `PLAN.md` (the task list) and this file (how) before changing anything.

## Rules for every contributor, human or agent

- Never commit secrets. Environment variable names go in `.env.example`, values never do.
- Payments stay in test mode until the owner goes live.
- Do not run `git commit` or `git push`. The studio orchestrator commits.
- `npm test` and `npm run build` must pass before work counts as done.
- Pages that answer a search query must be real tools or substantive answers, never thin filler.

## Stack, layout and commands

**Stack:** Astro 5 (static output, TypeScript strict) + Tailwind 4 (via `@tailwindcss/vite`, used sparingly; the look comes from `src/styles/global.css`) + Preact islands for the workbook. `pdf-lib` fills the IRS PDF, `fflate` builds the ZIP and `@noble/ed25519` verifies licenses. Tests use Vitest in Node. There is one Cloudflare Pages Function folder (`functions/api/`) for Stripe checkout and license signing; GitHub Pages previews have no functions, so the buy button must fail gracefully there.

**Layout**

```
astro.config.mjs        reads SITE_URL / SITE_BASE (GitHub Pages sub-path previews)
src/styles/global.css   THE design tokens (fonts, colours, pad ruling, buttons, inputs, pencil notes). See DESIGN.md
src/layouts/Base.astro  html shell: fonts, title/description/canonical, header, footer, optional cookie-free analytics
src/lib/url.ts          withBase(): every internal link and asset path goes through it
src/lib/engine/         pure TS engine (no DOM): types, dates, fifo, s1291, mtm, interest, excess, flags
src/lib/import/         paste / CSV parsing of lots
src/lib/pdf/            filling f8621.pdf, statements, ZIP
src/lib/license.ts      Ed25519 license verification
src/components/         Astro components + Preact islands (*.tsx)
src/data/               irs-underpayment-rates.json (quarterly §6621 rates with irs.gov sources), top-rates.json
src/content/legal/      owner's Impressum / Datenschutz HTML (installed by the studio, never edit)
public/forms/f8621.pdf  official IRS form, Rev. December 2025 (placed by the operator)
functions/api/          Cloudflare Pages Functions: checkout.ts, license.ts
tests/                  Vitest tests; tests/engine/ holds the fixtures 2a–2e from SPEC §6
scripts/                design-check.mjs (studio-owned, do not edit), list-pdf-fields.mjs, size.mjs
```

**Commands** (all exit on their own; never run `npm run dev`)

- `npm install`: install (keep `package-lock.json` committed; CI runs `npm ci`)
- `npm test`: `vitest run`, once
- `npm run build`: static build to `dist/`
- `npm run build:preview`: same build under `SITE_BASE=/preview`; every link in `dist/` must start with `/preview/`
- `npm run design-check`: the studio's check for AI-generated design habits; must exit 0
- `npm run pdf:fields`: lists AcroForm field names of `public/forms/f8621.pdf`
- `npm run size`: gzip size of JS/CSS in `dist/` (run after build)

**Conventions**

- Design: follow `DESIGN.md`. Use only the tokens in `global.css`. Use square corners, no gradients, no side-stripe callouts and no emoji. Every figure goes in IBM Plex Mono with tabular numerals. Use red-pencil notes (`.pencil-note`) for anything the user should check.
- Engine: compute in full precision and round only when writing form fields. Statements show cents. Every rule carries a source comment (IRC section or i8621 page). Never guess a missing value: block the fund with a clear message instead.
- Privacy: lot and fund data never leave the browser. The only network calls are to same-origin static assets and to `/api/checkout` and `/api/license`, and those request bodies hold no lot or fund data.
- Every results view and statement page carries: "Prepared with PFIC Workbook from figures you entered. This is not tax advice. Check it or have a preparer check it." Never write "IRS-approved", "CPA-reviewed" or "guaranteed".
- Legal pages render `src/content/legal/*.html` unchanged through `src/components/LegalText.astro`.
- Analytics: only if `PUBLIC_ANALYTICS_SRC` and `PUBLIC_ANALYTICS_DOMAIN` are set (a cookie-free, Plausible-compatible script). Custom events go through `window.plausible?.(...)`.
- Env names are in `.env.example`. Stripe stays in test mode.
